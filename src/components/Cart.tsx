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

interface AppliedCoupon {
  coupon: {
    _id: string;
    code: string;
    name?: string;
    discountType?: string;
    discountValue?: number;
  };
  discountAmount?: number;
  discount?: number; // For cart page structure
  finalAmount?: number; // For cart page structure
}

interface CartProps {
  showBackButton?: boolean;
  showCheckout?: boolean;
  items?: CartItem[];
  onQuantityChange?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
  isEditMode?: boolean;
  isLoading?: boolean;
  totalPrice?: number;
  appliedCoupon?: AppliedCoupon;
  isCartPage?: boolean;
  onCheckoutClick?: () => void;
}

export default function Cart({ 
  showBackButton = false,
  showCheckout = true,
  items,
  onQuantityChange,
  onRemoveItem,
  isEditMode = false,
  isLoading = false,
  totalPrice: externalTotalPrice,
  appliedCoupon,
  isCartPage = false,
  onCheckoutClick
}: CartProps) {
  const { cartItems, updateQuantity, removeFromCart, totalPrice: cartTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayItems = items || cartItems;
  const totalPrice = externalTotalPrice || cartTotalPrice;

  const handleCheckout = async () => {
    if (isSubmitting) return; // Prevent multiple clicks
    
    if (!user) {
      toast.error('Please login to place an order');
      router.push('/auth/login');
      return;
    }

    if (displayItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use custom checkout handler if provided
      if (onCheckoutClick) {
        onCheckoutClick();
        return;
      }

      // Navigate based on current page
      if (isCartPage) {
        // On cart page, go to checkout
        if (appliedCoupon) {
          // Store applied coupon in sessionStorage for checkout page
          sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
        }
        router.push('/checkout');
      } else {
        // On other pages (like main page), go to cart
        if (appliedCoupon) {
          // Store applied coupon in sessionStorage for cart page
          sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
        }
        router.push('/cart');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to navigate. Please try again.');
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

      {showCheckout && displayItems.length > 0 && !isEditMode && (
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
              
              {appliedCoupon && (appliedCoupon.discountAmount || appliedCoupon.discount || appliedCoupon.finalAmount) && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.coupon?.code || 'COUPON'})</span>
                  <span>-₹{(appliedCoupon.discountAmount || appliedCoupon.discount || appliedCoupon.finalAmount || 0).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{(() => {
                  const discountAmount = appliedCoupon?.discountAmount || appliedCoupon?.discount || appliedCoupon?.finalAmount || 0;
                  return discountAmount > 0 ? (totalPrice - discountAmount).toFixed(2) : totalPrice;
                })()}</span>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleCheckout}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Loading...' : (isCartPage ? 'Proceed to Checkout' : 'Proceed to Cart')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
} 