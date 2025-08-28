'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Cart from '@/components/Cart';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("pending");
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const fetchOrders = async () => {
        try {
          const endpoint = isAdmin ? '/orders' : '/orders/my-orders';
          const response = await api.get(endpoint);
          if (response.ok) {
            const data = await response.json();
            setOrders(data);
          } else {
            toast.error('Failed to load orders');
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
          toast.error('Failed to load orders');
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrders();
    }
  }, [user, isAdmin, router, authLoading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'confirmed':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'hold':
        return 'bg-gray-900';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'confirmed':
        return 'Confirmed';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'hold':
        return 'Hold';
      default:
        return status;
    }
  };

  const groupOrdersByStatus = (orders: Order[]) => {
    const grouped: Record<string, Order[]> = {
      pending: [],
      processing: [],
      confirmed: [],
      delivered: [],
      cancelled: [],
      hold: []
    };

    orders.forEach(order => {
      grouped[order.status] = grouped[order.status] || [];
      grouped[order.status].push(order);
    });

    return grouped;
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (!editingOrder) return;
    
    // Update the editedItems state
    setEditedItems(prev => 
      prev.map(item => 
        item.product._id === productId 
          ? { ...item, quantity } 
          : item
      )
    );

    // Update the editedQuantities state
    setEditedQuantities(prev => ({
      ...prev,
      [`${editingOrder}-${productId}`]: quantity
    }));
  };

  const handleRemoveItem = (productId: string) => {
    if (!editingOrder) return;
    
    // Update editedItems state
    setEditedItems(prev => prev.filter(item => item.product._id !== productId));
    
    // Update editedQuantities state
    setEditedQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[`${editingOrder}-${productId}`];
      return newQuantities;
    });
  };

  const handleEditOrder = (orderId: string) => {
    setEditingOrder(orderId);
    const order = orders.find(o => o._id === orderId);
    if (order) {
      // Initialize editedItems with a deep copy of order items
      setEditedItems(order.items.map(item => ({
        ...item,
        product: { ...item.product }
      })));
      
      // Initialize editedQuantities
      const quantities: Record<string, number> = {};
      order.items.forEach(item => {
        quantities[`${orderId}-${item.product._id}`] = item.quantity;
      });
      setEditedQuantities(quantities);
    }
  };

  const handleSaveOrder = async () => {
    if (!editingOrder) return;
    try {
      const order = orders.find(o => o._id === editingOrder);
      if (!order) return;

      if (editedItems.length === 0) {
        // If all items are removed, cancel the order
        await api.patch(`/orders/${editingOrder}/status`, { status: 'cancelled' });
        toast.success('Order cancelled as all items were removed');
      } else {
        // Calculate total amount based on edited items and quantities
        const totalAmount = editedItems.reduce((total, item) => {
          const quantity = editedQuantities[`${editingOrder}-${item.product._id}`] || item.quantity;
          return total + (item.product.price * quantity);
        }, 0);

        const updatedItems = editedItems.map(item => ({
          product: item.product._id,
          quantity: editedQuantities[`${editingOrder}-${item.product._id}`] || item.quantity,
          price: item.product.price
        }));

        await api.put(`/orders/${editingOrder}`, { 
          items: updatedItems,
          totalAmount 
        });
        toast.success('Order updated successfully');
      }
      
      setEditingOrder(null);
      
      // Refresh orders
      const endpoint = isAdmin ? '/orders' : '/orders/my-orders';
      const response = await api.get(endpoint);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (response.ok) {
        toast.success('Order status updated successfully');
        
        // Refresh orders
        const endpoint = isAdmin ? '/orders' : '/orders/my-orders';
        const refreshResponse = await api.get(endpoint);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setOrders(data);
        }
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'confirmed':
        return '🔔';
      case 'delivered':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  const groupedOrders = groupOrdersByStatus(orders);

  const getEmptyStateMessage = () => {
    if (orders.length === 0) {
      return "No orders found";
    }
    if (selectedStatus) {
      return `No ${getStatusText(selectedStatus).toLowerCase()} orders found`;
    }
    return "No orders found";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{isAdmin ? 'All Orders' : 'My Orders'}</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{getEmptyStateMessage()}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Status Grid Filter */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {Object.entries(groupedOrders).map(([status, statusOrders]) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                  selectedStatus === status 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <span className="text-2xl mb-2">{getStatusIcon(status)}</span>
                <span className="font-medium capitalize">{getStatusText(status)}</span>
                <span className={`text-sm mt-1 px-2 py-1 rounded-full text-white ${getStatusColor(status)}`}>
                  {statusOrders.length}
                </span>
              </button>
            ))}
          </div>

          {/* Orders Display */}
          <div className="space-y-8">
            {Object.entries(groupedOrders).map(([status, statusOrders]) => 
              statusOrders.length > 0 && (!selectedStatus || selectedStatus === status) && (
                <div key={status} className="space-y-4">
                  <div className="flex items-center justify-start gap-3">
                    <h2 className="text-xl font-semibold capitalize">{getStatusText(status)} Orders</h2>
                    <span className={`px-3 py-1 rounded-full text-sm text-white ${getStatusColor(status)}`}>
                      {statusOrders.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statusOrders.map((order) => (
                      <Card key={order._id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <CardTitle className="text-base sm:text-lg">Order #{order._id.slice(-6)}</CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {format(new Date(order.createdAt), 'MMM dd, yyyy hh:mm a')}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {isAdmin && (
                              <>
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => handleStatusUpdate(order._id, value)}
                                >
                                  <SelectTrigger className="w-full sm:w-[120px]">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="confirmed">Confirmeds</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                                {editingOrder === order._id ? (
                                  <Button 
                                    variant="default" 
                                    onClick={() => setEditingOrder(null)}
                                    size="sm"
                                    className="w-full sm:w-auto"
                                  >
                                    Cancel Edit
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    onClick={() => handleEditOrder(order._id)}
                                    size="sm"
                                    className="w-full sm:w-auto"
                                  >
                                    Edit Order
                                  </Button>
                                )}
                              
                              </>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {editingOrder === order._id ? (
                            <Cart
                              items={editedItems}
                              onQuantityChange={handleQuantityChange}
                              onRemoveItem={handleRemoveItem}
                              onSave={handleSaveOrder}
                              isEditMode={true}
                              isLoading={isLoading}
                              totalPrice={order.totalAmount}
                            />
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {order.items.map((item) => (
                                  <div key={item.product._id} className="flex items-center justify-between py-2 border-b">
                                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                                      <img
                                        src={item.product.imageUrl}
                                        alt={item.product.name}
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                                        <p className="text-xs text-muted-foreground">₹{item.product.price} x {item.quantity}</p>
                                      </div>
                                    </div>
                                    <p className="font-medium text-sm whitespace-nowrap ml-2">₹{item.product.price * item.quantity}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between items-center font-bold mt-4 pt-2 border-t">
                                <span className="text-sm sm:text-base">Total Amount</span>
                                <span className="text-sm sm:text-base">₹{order.totalAmount}</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            )}
            {selectedStatus && groupedOrders[selectedStatus]?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{getEmptyStateMessage()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 