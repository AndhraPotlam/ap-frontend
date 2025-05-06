'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
  quantity: number;
  price: number;
}

interface CartProps {
  showBackButton?: boolean;
  showCheckout?: boolean;
  items?: CartItem[];
  onQuantityChange?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
  onSave?: () => void;
  isEditMode?: boolean;
  isLoading?: boolean;
  totalPrice?: number;
}

export default function Cart({ 
  showBackButton = false,
  showCheckout = true,
  items,
  onQuantityChange,
  onRemoveItem,
  onSave,
  isEditMode = false,
  isLoading = false,
  totalPrice: externalTotalPrice
}: CartProps) {
  const { cartItems, updateQuantity, removeFromCart, totalPrice: cartTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayItems = items || cartItems;
  const totalPrice = externalTotalPrice || cartTotalPrice;

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      router.push('/auth/login');
      return;
    }

    if (displayItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setIsSubmitting(true);
      const orderData = {
        items: displayItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        })),
        totalAmount: totalPrice,
        status: 'pending'
      };

      const response = await api.post('/orders', orderData);
      toast.success('Order placed successfully!');
      clearCart();
      router.push('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (onQuantityChange) {
      onQuantityChange(productId, quantity);
    } else {
      updateQuantity(productId, quantity);
    }
  };

  const handleRemoveItem = (productId: string) => {
    if (onRemoveItem) {
      onRemoveItem(productId);
      // Remove from edited quantities if in edit mode
      if (isEditMode && items) {
        const updatedItems = items.filter(item => item.product._id !== productId);
        if (updatedItems.length === 0) {
          toast.success('All items removed. Order will be cancelled.');
        }
      }
    } else {
      removeFromCart(productId);
      toast.success('Item removed from cart');
    }
  };

  return (
    <div className="w-full">
      {showBackButton && (
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? 'Edit Order Items' : `Your Cart (${displayItems.length} items)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayItems.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No items found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayItems.map((item) => (
                <div key={item.product._id} className="flex flex-col items-center justify-start py-2 border rounded-lg">
                  <div className="flex flex-row items-center space-x-1 w-full justify-between px-2">
                    <img
                      src={item.product.imageUrl || '/placeholder.png'}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground"> ₹{item.product.price} x {item.quantity} = ₹{item.product.price * item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-1 w-full">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRemoveItem(item.product._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                      <Trash2 className="h-4 w-4 ml-1" />
                    </Button>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground font-bold px-2">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCheckout && displayItems.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{totalPrice}</span>
              </div>
              {isEditMode ? (
                <Button 
                  className="w-full" 
                  onClick={onSave}
                  disabled={isLoading || isSubmitting || displayItems.length === 0}
                >
                  {isLoading || isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Placing Order...' : 'Proceed to Checkout'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 