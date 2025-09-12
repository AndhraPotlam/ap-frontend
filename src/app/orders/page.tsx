'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Cart from '@/components/Cart';
import { CheckCircle, ArrowLeft } from 'lucide-react';

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
  user: string | {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  pricing?: {
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    shippingCost: number;
    discountAmount: number;
    discountCode: string;
    totalAmount: number;
  };
  appliedCoupon?: {
    couponId: string;
    code: string;
    discountAmount: number;
  };
  automaticDiscounts?: Array<{
    discount: {
      _id: string;
      name: string;
      type: string;
      value: number;
    };
    discountAmount: number;
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("pending");
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [orderIdFilter, setOrderIdFilter] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [error, setError] = useState('');
  const [calculatedPricing, setCalculatedPricing] = useState<any>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const fetchOrders = async () => {
        try {
          const endpoint = isAdmin ? '/orders/all' : '/orders/my-orders';
          const response = await api.get(endpoint);
          if (response.ok) {
            const data = await response.json();
            console.log('Orders data received:', data);
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

  // Recalculate pricing when editedItems change during editing
  useEffect(() => {
    if (editingOrder && editedItems.length > 0) {
      fetchPricing(editedItems, appliedCoupon?.coupon.code);
    }
  }, [editingOrder, editedItems, appliedCoupon]);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      toast.success('Order confirmed!', {
        description: `Your order #${orderId} has been confirmed.`,
        icon: <CheckCircle className="h-6 w-6" />,
      });
      router.push('/orders'); // Redirect to orders page after confirmation
    }
  }, [searchParams, router]);

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

    // Filter orders by customer and/or order ID if filters are applied (admin only)
    let filteredOrders = orders;
    
    if (isAdmin) {
      // Apply customer filter
      if (customerFilter.trim()) {
        filteredOrders = filteredOrders.filter(order => {
          const customerName = getUserDisplayName(order.user).toLowerCase();
          const filterText = customerFilter.toLowerCase();
          return customerName.includes(filterText) || 
                 (typeof order.user === 'object' && order.user.email.toLowerCase().includes(filterText));
        });
      }
      
      // Apply order ID filter
      if (orderIdFilter.trim()) {
        filteredOrders = filteredOrders.filter(order => {
          const orderId = order._id.toLowerCase();
          const filterText = orderIdFilter.toLowerCase();
          return orderId.includes(filterText);
        });
      }
    }

    filteredOrders.forEach(order => {
      grouped[order.status] = grouped[order.status] || [];
      grouped[order.status].push(order);
    });

    return grouped;
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setEditedQuantities(prev => ({
      ...prev,
      [`${editingOrder}-${productId}`]: newQuantity
    }));
    
    // Update editedItems with new quantity
    setEditedItems(prev => prev.map(item => 
      item.product._id === productId ? { ...item, quantity: newQuantity } : item
    ));
    
    // Recalculate pricing with new quantities
    const updatedItems = editedItems.map(item => {
      const quantity = item.product._id === productId ? newQuantity : 
        (editedQuantities[`${editingOrder}-${item.product._id}`] || item.quantity);
      return { ...item, quantity };
    });
    
    fetchPricing(updatedItems, appliedCoupon?.coupon.code);
  };

  const handleRemoveItem = (productId: string) => {
    setEditedItems(prev => prev.filter(item => item.product._id !== productId));
    
    // Remove from editedQuantities
    setEditedQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[`${editingOrder}-${productId}`];
      return newQuantities;
    });
    
    // Recalculate pricing with updated items
    const updatedItems = editedItems.filter(item => item.product._id !== productId);
    fetchPricing(updatedItems, appliedCoupon?.coupon.code);
  };

  const handleEditOrder = (orderId: string) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    // Check if order can be edited
    if (['confirmed', 'delivered', 'cancelled'].includes(order.status)) {
      toast.error(`Cannot edit ${order.status} orders. Only pending and processing orders can be edited.`);
      return;
    }

    setEditingOrder(orderId);
    setEditedItems([...order.items]);
    
    // Initialize edited quantities
    const quantities: Record<string, number> = {};
    order.items.forEach(item => {
      quantities[`${orderId}-${item.product._id}`] = item.quantity;
    });
    setEditedQuantities(quantities);
    
    // Retain existing coupon if it exists
    if (order.appliedCoupon) {
      setAppliedCoupon({
        coupon: {
          _id: order.appliedCoupon.couponId,
          code: order.appliedCoupon.code,
          name: order.appliedCoupon.code,
          discountType: 'fixed',
          discountValue: order.appliedCoupon.discountAmount
        },
        discountAmount: order.appliedCoupon.discountAmount
      });
      setCouponCode(order.appliedCoupon.code);
    } else {
      setAppliedCoupon(null);
      setCouponCode('');
    }
    setError('');
    
    // Fetch initial pricing with existing coupon
    fetchPricing(order.items, order.appliedCoupon?.code);
  };

  const handleSaveOrder = async () => {
    try {
      const order = orders.find(o => o._id === editingOrder);
      if (!order) {
        console.error('Order not found for editing:', editingOrder);
        toast.error('Order not found');
        return;
      }

      console.log('🔍 Saving order:', editingOrder, 'editedItems:', editedItems.length, 'editedItems:', editedItems);

      if (editedItems.length === 0) {
        // If all items are removed, cancel the order
        console.log('🔍 Cancelling order as all items removed');
        const response = await api.patch(`/orders/${editingOrder}/status`, { status: 'cancelled' });
        if (response.ok) {
          toast.success('Order cancelled as all items were removed');
        } else {
          const errorData = await response.json();
          console.error('Failed to cancel order:', errorData);
          toast.error('Failed to cancel order');
          return;
        }
      } else {
        // Prepare items for backend processing - no frontend calculations
        const updatedItems = editedItems.map(item => ({
          product: item.product._id,
          quantity: editedQuantities[`${editingOrder}-${item.product._id}`] || item.quantity
        }));

        console.log('🔍 editedQuantities:', editedQuantities);
        console.log('🔍 updatedItems:', updatedItems);

        // Prepare order update data with coupon information
        const orderUpdateData: any = { 
          items: updatedItems
        };

        // Add coupon information if applied
        if (appliedCoupon) {
          orderUpdateData.couponCode = appliedCoupon.coupon.code;
        }

        console.log('🔍 Sending order update data:', orderUpdateData);

        const response = await api.put(`/orders/${editingOrder}`, orderUpdateData);
        if (response.ok) {
          toast.success('Order updated successfully');
        } else {
          const errorData = await response.json();
          console.error('Failed to update order:', errorData);
          toast.error(`Failed to update order: ${errorData.message || 'Unknown error'}`);
          return;
        }
      }
      
      setEditingOrder(null);
      
      // Refresh orders
      const endpoint = isAdmin ? '/orders/all' : '/orders/my-orders';
      const response = await api.get(endpoint);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        console.error('Failed to refresh orders after update');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fetch pricing from backend whenever cart or coupon changes
  const fetchPricing = async (items: OrderItem[], couponCode?: string) => {
    if (items.length === 0) {
      setCalculatedPricing(null);
      return;
    }

    // Check if the original order had any discounts or coupons
    const currentOrder = orders.find(o => o._id === editingOrder);
    if (!currentOrder) {
      setCalculatedPricing(null);
      return;
    }

    const originalOrderHadDiscounts = currentOrder.appliedCoupon || 
                                      (currentOrder.automaticDiscounts && currentOrder.automaticDiscounts.length > 0) ||
                                      (currentOrder.pricing && currentOrder.pricing.discountAmount > 0);

    // If no coupon is being applied AND original order had no discounts, preserve original pricing
    if (!couponCode && !originalOrderHadDiscounts) {
      // For orders without original discounts, we still need to get pricing from backend
      // to ensure consistency and avoid frontend calculations
      // But we'll indicate this is a "preserve original" scenario
      setIsLoadingPricing(true);
      try {
        const orderItems = items.map((item: any) => ({
          product: item.product._id,
          quantity: item.quantity
        }));

        // Send a special flag to indicate "preserve original pricing"
        const response = await api.post('/orders/calculate', {
          items: orderItems,
          couponCode: null,
          preserveOriginalPricing: true
        });

        if (response.ok) {
          const pricing = await response.json();
          setCalculatedPricing(pricing);
        } else {
          console.error('Failed to fetch pricing');
          setCalculatedPricing(null);
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
        setCalculatedPricing(null);
      } finally {
        setIsLoadingPricing(false);
      }
      return;
    }

    // Only fetch pricing from backend when:
    // 1. The original order had discounts (automatic or coupons), OR
    // 2. A new coupon is being applied (but NO automatic discounts)
    setIsLoadingPricing(true);
    try {
      const orderItems = items.map((item: any) => ({
        product: item.product._id,
        quantity: item.quantity
      }));

      // Determine whether to preserve original pricing:
      // - If original order had discounts: apply current automatic discount rules (preserveOriginalPricing: false)
      // - If no original discounts AND no new coupon: preserve original pricing (preserveOriginalPricing: true)
      // - If no original discounts BUT new coupon: preserve original pricing structure (preserveOriginalPricing: true)
      const preserveOriginalPricing = !originalOrderHadDiscounts;
      
      console.log('🔍 Frontend - originalOrderHadDiscounts:', originalOrderHadDiscounts, 'couponCode:', couponCode, 'preserveOriginalPricing:', preserveOriginalPricing);
      
      const response = await api.post('/orders/calculate', {
        items: orderItems,
        couponCode: couponCode || null,
        preserveOriginalPricing: preserveOriginalPricing
      });

      if (response.ok) {
        const pricing = await response.json();
        setCalculatedPricing(pricing);
        
        console.log('🔍 Frontend - Backend response:', {
          automaticDiscounts: pricing.automaticDiscounts?.length || 0,
          totalAutomaticDiscount: pricing.totalAutomaticDiscount || 0,
          couponDiscount: pricing.couponDiscount || 0,
          preserveOriginalPricing: preserveOriginalPricing
        });
        
        // Show appropriate message based on whether automatic discounts were applied
        if (pricing.automaticDiscounts && pricing.automaticDiscounts.length > 0) {
          // Automatic discounts were applied
          const totalAutoDiscount = pricing.automaticDiscounts.reduce((sum: number, discount: any) => sum + discount.discountAmount, 0);
          const hasCoupon = pricing.couponDiscount > 0;
          const message = hasCoupon 
            ? `🎉 ${pricing.automaticDiscounts.length} automatic discount(s) + coupon applied! Total savings: ₹${(totalAutoDiscount + pricing.couponDiscount).toFixed(2)}`
            : `🎉 ${pricing.automaticDiscounts.length} automatic discount(s) applied! Total savings: ₹${totalAutoDiscount.toFixed(2)}`;
          toast.success(message);
        } else {
          // No automatic discounts were applied
          const hasCoupon = pricing.couponDiscount > 0;
          if (hasCoupon) {
            toast.info(`✅ Coupon applied! No automatic discounts available. Total savings: ₹${pricing.couponDiscount.toFixed(2)}`);
          } else {
            toast.info(`ℹ️ No automatic discounts or coupons applied.`);
          }
        }
      } else {
        console.error('Failed to fetch pricing');
        setCalculatedPricing(null);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setCalculatedPricing(null);
    } finally {
      setIsLoadingPricing(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (editedItems.length === 0) {
      toast.error('Your order is empty');
      return;
    }

    try {
      setIsValidating(true);
      setError('');

      const totalPrice = editedItems.reduce((total, item) => {
        const quantity = editedQuantities[`${editingOrder!}-${item.product._id}`] || item.quantity;
        return total + (item.product.price * quantity);
      }, 0);

      const response = await api.post('/coupons/validate', {
        code: couponCode.toUpperCase(),
        orderAmount: totalPrice
      });

      if (response.ok) {
        const data = await response.json();
        setAppliedCoupon({
          coupon: {
            _id: data.coupon._id,
            code: data.coupon.code,
            name: data.coupon.name,
            discountType: data.coupon.discountType,
            discountValue: data.coupon.discountValue
          },
          discount: data.discount,
          finalAmount: data.finalAmount
        });
        toast.success(`Coupon applied! ${data.discount}₹ discount`);
        setCouponCode('');
        
        // Fetch updated pricing with coupon
        fetchPricing(editedItems, data.coupon.code);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid coupon code');
        toast.error('Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setError('Failed to apply coupon');
      toast.error('Failed to apply coupon');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setError('');
    toast.success('Coupon removed successfully');
    // Recalculate pricing without coupon
    fetchPricing(editedItems);
  };

  const handleReplaceCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setError('');
    toast.success('Coupon removed. You can now apply a new coupon.');
    // Recalculate pricing without coupon
    fetchPricing(editedItems);
  };

  // Helper function to get current total price - only from backend
  const getCurrentTotalPrice = () => {
    if (calculatedPricing) {
      return calculatedPricing.finalTotal;
    }
    // If no backend pricing available, return 0 to avoid frontend calculations
    return 0;
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (response.ok) {
        toast.success('Order status updated successfully');
        
        // Refresh orders
        const endpoint = isAdmin ? '/orders/all' : '/orders/my-orders';
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

  const getUserDisplayName = (orderUser: string | { _id: string; email: string; firstName?: string; lastName?: string }) => {
    if (typeof orderUser === 'string') {
      return 'User';
    }
    
    if (orderUser.firstName && orderUser.lastName) {
      return `${orderUser.firstName} ${orderUser.lastName}`;
    }
    
    return orderUser.email;
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
    
    if (isAdmin && (customerFilter.trim() || orderIdFilter.trim())) {
      const filters = [];
      if (customerFilter.trim()) filters.push(`customers matching "${customerFilter}"`);
      if (orderIdFilter.trim()) filters.push(`order ID matching "${orderIdFilter}"`);
      
      const filterText = filters.join(' and ');
      
      if (selectedStatus) {
        return `No ${getStatusText(selectedStatus).toLowerCase()} orders found for ${filterText}`;
      }
      return `No orders found for ${filterText}`;
    }
    
    if (selectedStatus) {
      return `No ${getStatusText(selectedStatus).toLowerCase()} orders found`;
    }
    return "No orders found";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Dashboard Button */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">
        {isAdmin ? 'All Orders' : 'My Orders'}
      </h1>

      {/* Order Confirmation Alert */}
      {searchParams.get('orderId') && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Order Confirmed!</strong> Your order #{searchParams.get('orderId')} has been successfully placed. 
            You will receive an email confirmation shortly.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center">Loading orders...</div>
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

          {/* Filters (Admin Only) */}
          {isAdmin && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              {/* Customer Filter */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <label htmlFor="customerFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filter by Customer:
                </label>
                <Input
                  id="customerFilter"
                  type="text"
                  placeholder="Search by customer name or email..."
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="flex-1"
                />
                {customerFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomerFilter('')}
                    className="whitespace-nowrap"
                  >
                    Clear Customer
                  </Button>
                )}
              </div>
              
              {/* Order ID Filter */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <label htmlFor="orderIdFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filter by Order ID:
                </label>
                <Input
                  id="orderIdFilter"
                  type="text"
                  placeholder="Search by order ID..."
                  value={orderIdFilter}
                  onChange={(e) => setOrderIdFilter(e.target.value)}
                  className="flex-1"
                />
                {orderIdFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOrderIdFilter('')}
                    className="whitespace-nowrap"
                  >
                    Clear Order ID
                  </Button>
                )}
              </div>
              
              {/* Clear All Filters */}
              {(customerFilter || orderIdFilter) && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomerFilter('');
                      setOrderIdFilter('');
                    }}
                    className="whitespace-nowrap"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
              
              {/* Filter Status */}
              {(customerFilter || orderIdFilter) && (
                <div className="text-xs text-gray-600 space-y-1">
                  {customerFilter && (
                    <p>Customer filter: "{customerFilter}"</p>
                  )}
                  {orderIdFilter && (
                    <p>Order ID filter: "{orderIdFilter}"</p>
                  )}
                </div>
              )}
            </div>
          )}

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
                            {isAdmin && (
                              <p className="text-xs sm:text-sm text-blue-600 font-medium">
                                Customer: {getUserDisplayName(order.user)}
                              </p>
                            )}
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
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setEditingOrder(null)}
                                      size="sm"
                                      className="flex-1 sm:flex-none"
                                    >
                                      Cancel Edit
                                    </Button>
                                    <Button 
                                      variant="default" 
                                      onClick={handleSaveOrder}
                                      size="sm"
                                      className="flex-1 sm:flex-none"
                                      disabled={isLoading}
                                    >
                                      {isLoading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    onClick={() => handleEditOrder(order._id)}
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    disabled={['confirmed', 'delivered', 'cancelled'].includes(order.status)}
                                    title={['confirmed', 'delivered', 'cancelled'].includes(order.status) 
                                      ? `Cannot edit ${order.status} orders` 
                                      : 'Edit order items and pricing'}
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
                            <div className="space-y-6">
                              {/* Coupon Section */}
                              <div className="space-y-4">
                                <h4 className="font-medium">Apply Coupon</h4>
                                {error && (
                                  <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                  </Alert>
                                )}

                                {appliedCoupon ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <div>
                                          <p className="font-medium text-green-800">Applied Coupon: {appliedCoupon.coupon.code}</p>
                                          <p className="text-sm text-green-600">
                                            {appliedCoupon.coupon.discountType === 'percentage' 
                                              ? `${appliedCoupon.coupon.discountValue}% off` 
                                              : `₹${appliedCoupon.coupon.discountValue} off`}
                                          </p>
                                          <p className="text-xs text-green-500">Current discount: ₹{appliedCoupon.discountAmount.toFixed(2)}</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleReplaceCoupon}
                                          className="text-green-600 hover:text-green-700"
                                        >
                                          Replace
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={handleRemoveCoupon}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex gap-2">
                                      <Input
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        placeholder="Enter coupon code"
                                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                        className="flex-1"
                                      />
                                      <Button
                                        onClick={handleApplyCoupon}
                                        disabled={isValidating || !couponCode.trim()}
                                        size="sm"
                                      >
                                        {isValidating ? 'Applying...' : 'Apply'}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Cart Items */}
                              <Cart
                                items={editedItems}
                                onQuantityChange={handleQuantityChange}
                                onRemoveItem={handleRemoveItem}
                                isEditMode={true}
                                isLoading={isLoading}
                                totalPrice={getCurrentTotalPrice()}
                                appliedCoupon={appliedCoupon}
                                isCartPage={false}
                              />

                              {/* Detailed Pricing Summary */}
                              {calculatedPricing && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                      <span>Subtotal ({editedItems.length} items)</span>
                                      <span>₹{calculatedPricing.subtotal.toFixed(2)}</span>
                                    </div>
                                    
                                    {/* Show coupon discount first */}
                                    {calculatedPricing.couponDiscount > 0 && (
                                      <div className="flex justify-between text-green-600">
                                        <span>Coupon Discount ({calculatedPricing.appliedCoupon?.coupon.code || 'COUPON'})</span>
                                        <span>-₹{calculatedPricing.couponDiscount.toFixed(2)}</span>
                                      </div>
                                    )}
                                    
                                    {/* Show amount after coupon discount */}
                                    {calculatedPricing.couponDiscount > 0 && (
                                      <div className="flex justify-between text-gray-600 text-sm">
                                        <span>Amount after coupon</span>
                                        <span>₹{calculatedPricing.amountAfterCoupon.toFixed(2)}</span>
                                      </div>
                                    )}
                                    
                                    {calculatedPricing.taxAmount > 0 && (
                                      <div className="flex justify-between">
                                        <span>Tax ({(calculatedPricing.taxRate * 100).toFixed(0)}%)</span>
                                        <span>₹{calculatedPricing.taxAmount.toFixed(2)}</span>
                                      </div>
                                    )}
                                    
                                    {calculatedPricing.shippingCost > 0 && (
                                      <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span>₹{calculatedPricing.shippingCost.toFixed(2)}</span>
                                      </div>
                                    )}
                                    
                                    {/* Show automatic discounts (calculated on amount after coupon) */}
                                    {calculatedPricing.automaticDiscounts && calculatedPricing.automaticDiscounts.length > 0 && (
                                      <>
                                        {calculatedPricing.automaticDiscounts.map((autoDiscount: any, index: number) => (
                                          <div key={index} className="flex justify-between text-green-600">
                                            <span>Auto Discount ({autoDiscount.discount.name})</span>
                                            <span>-₹{autoDiscount.discountAmount.toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </>
                                    )}
                                    
                                    {/* Total Savings Summary */}
                                    {calculatedPricing && (calculatedPricing.totalAutomaticDiscount > 0 || calculatedPricing.couponDiscount > 0) && (
                                      <div className="flex justify-between text-green-600 font-semibold border-t pt-2">
                                        <span>Total Savings</span>
                                        <span>-₹{(calculatedPricing.totalAutomaticDiscount + calculatedPricing.couponDiscount).toFixed(2)}</span>
                                      </div>
                                    )}
                                    
                                    <div className="border-t pt-3">
                                      <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>₹{calculatedPricing.finalTotal.toFixed(2)}</span>
                                      </div>
                                    </div>
                                    
                                    {calculatedPricing && (calculatedPricing.couponDiscount > 0 || calculatedPricing.totalAutomaticDiscount > 0) && (
                                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                                        <p>You saved ₹{(calculatedPricing.couponDiscount + calculatedPricing.totalAutomaticDiscount).toFixed(2)}!</p>
                                      </div>
                                    )}
                                    
                                    {isLoadingPricing && (
                                      <div className="text-sm text-gray-500 text-center">
                                        Calculating pricing...
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )}
                            </div>
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
                              
                              {/* Order Summary with Applied Coupons and Discounts */}
                              <div className="space-y-3 pt-2 border-t">
                                {/* Subtotal */}
                                <div className="flex justify-between text-sm">
                                  <span>Subtotal ({order.items.length} items)</span>
                                  <span>₹{order.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}</span>
                                </div>
                                
                                {/* Show applied coupon if exists */}
                                {order.appliedCoupon && (
                                  <div className="flex justify-between text-green-600 text-sm">
                                    <span>Coupon Discount ({order.appliedCoupon.code})</span>
                                    <span>-₹{order.appliedCoupon.discountAmount.toFixed(2)}</span>
                                  </div>
                                )}
                                
                                {/* Show automatic discounts if exist */}
                                {order.automaticDiscounts && order.automaticDiscounts.length > 0 && (
                                  <>
                                    {order.automaticDiscounts.map((autoDiscount, index) => (
                                      <div key={index} className="flex justify-between text-green-600 text-sm">
                                        <span>Auto Discount ({autoDiscount.discount.name})</span>
                                        <span>-₹{autoDiscount.discountAmount.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </>
                                )}
                                
                                {/* Show message if no automatic discounts */}
                                {(!order.automaticDiscounts || order.automaticDiscounts.length === 0) && (
                                  <div className="text-xs text-gray-500 text-center py-1">
                                    No automatic discounts applied
                                  </div>
                                )}
                                
                                {/* Show tax if exists */}
                                {order.pricing && order.pricing.taxAmount > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span>Tax ({(order.pricing.taxRate * 100).toFixed(0)}%)</span>
                                    <span>₹{order.pricing.taxAmount.toFixed(2)}</span>
                                  </div>
                                )}
                                
                                {/* Show shipping if exists */}
                                {order.pricing && order.pricing.shippingCost > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span>Shipping</span>
                                    <span>₹{order.pricing.shippingCost.toFixed(2)}</span>
                                  </div>
                                )}
                                
                                {/* Total Savings if any discounts applied */}
                                {((order.appliedCoupon && order.appliedCoupon.discountAmount > 0) || 
                                  (order.automaticDiscounts && order.automaticDiscounts.length > 0)) && (
                                  <div className="flex justify-between text-green-600 font-semibold text-sm border-t pt-2">
                                    <span>Total Savings</span>
                                    <span>-₹{(
                                      (order.appliedCoupon?.discountAmount || 0) + 
                                      (order.automaticDiscounts?.reduce((sum, d) => sum + d.discountAmount, 0) || 0)
                                    ).toFixed(2)}</span>
                                  </div>
                                )}
                                
                                {/* Final Total */}
                                <div className="flex justify-between items-center font-bold mt-4 pt-2 border-t">
                                  <span className="text-sm sm:text-base">Total Amount</span>
                                  <span className="text-sm sm:text-base">₹{order.totalAmount}</span>
                                </div>
                                
                                {/* Savings message */}
                                {((order.appliedCoupon && order.appliedCoupon.discountAmount > 0) || 
                                  (order.automaticDiscounts && order.automaticDiscounts.length > 0)) && (
                                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded text-center">
                                    <p>You saved ₹{(
                                      (order.appliedCoupon?.discountAmount || 0) + 
                                      (order.automaticDiscounts?.reduce((sum, d) => sum + d.discountAmount, 0) || 0)
                                    ).toFixed(2)}!</p>
                                  </div>
                                )}
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