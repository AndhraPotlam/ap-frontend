'use client';
import React, { useState, useEffect } from 'react';
import Cart from '@/components/Cart';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Tag, X, CheckCircle, Percent, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
}

interface AppliedCoupon {
  coupon: Coupon;
  discount: number;
  finalAmount: number;
}

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, totalItems, totalPrice, isLoading: cartLoading } = useCart();
  const router = useRouter();
  
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState('');
  const [calculatedPricing, setCalculatedPricing] = useState<any>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);

  // Fetch pricing from backend whenever cart or coupon changes
  useEffect(() => {
    const fetchPricing = async () => {
      if (totalItems === 0) {
        setCalculatedPricing(null);
        return;
      }

      setIsLoadingPricing(true);
      try {
        const items = cartItems.map((item: any) => ({
          product: item.product._id,
          quantity: item.quantity
        }));

        const response = await api.post('/orders/calculate', {
          items,
          couponCode: appliedCoupon?.coupon.code || null
        });

        if (response.ok) {
          const pricing = await response.json();
          setCalculatedPricing(pricing);
          
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

    fetchPricing();
  }, [cartItems, appliedCoupon, totalItems]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (totalItems === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setIsValidating(true);
      setError('');

      const response = await api.post('/coupons/validate', {
        code: couponCode.toUpperCase(),
        orderAmount: totalPrice
      });

      if (response.ok) {
        const data = await response.json();
        // Store only the coupon code and basic info for display
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
    toast.success('Coupon removed');
  };

  const getFinalTotal = () => {
    if (calculatedPricing) {
      return calculatedPricing.finalTotal;
    }
    return totalPrice;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your cart.</p>
          <Button onClick={() => router.push('/auth/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
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

        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Cart 
              showBackButton={true} 
              showCheckout={false} 
              appliedCoupon={appliedCoupon || undefined}
              isCartPage={true}
            />
          </div>

          {/* Coupon and Order Summary */}
          <div className="space-y-6">
            {/* Automatic Discounts Info */}
            {calculatedPricing && calculatedPricing.automaticDiscounts && calculatedPricing.automaticDiscounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    {calculatedPricing.couponDiscount > 0 ? 'Automatic Discounts + Coupon Applied' : 'Automatic Discounts Applied'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {calculatedPricing.automaticDiscounts.map((autoDiscount: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">{autoDiscount.discount.name}</p>
                          <p className="text-sm text-green-600">
                            {autoDiscount.discount.type === 'percentage' ? `${autoDiscount.discount.value}% off` : `₹${autoDiscount.discount.value} off`}
                          </p>
                        </div>
                        <div className="text-green-600 font-bold">
                          -₹{autoDiscount.discountAmount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Coupon Section */}
            {isAuthenticated && totalItems > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Apply Coupon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            <p className="font-medium text-green-800">{appliedCoupon.coupon.name}</p>
                            <p className="text-sm text-green-600">{appliedCoupon.coupon.code}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-green-600 hover:text-green-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        {appliedCoupon.coupon.discountType === 'percentage' ? (
                          <Percent className="h-4 w-4" />
                        ) : (
                          <Tag className="h-4 w-4" />
                        )}
                        <span>
                          {appliedCoupon.coupon.discountValue}
                          {appliedCoupon.coupon.discountType === 'percentage' ? '%' : '₹'} off applied
                        </span>
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
                        />
                        <Button
                          onClick={handleApplyCoupon}
                          disabled={isValidating || !couponCode.trim()}
                          size="sm"
                        >
                          {isValidating ? 'Applying...' : 'Apply'}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Have a coupon code? Enter it above to get a discount on your order.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            {totalItems > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>₹{calculatedPricing ? calculatedPricing.subtotal.toFixed(2) : totalPrice.toFixed(2)}</span>
                  </div>
                  
                  {/* Show coupon discount first */}
                  {calculatedPricing && calculatedPricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount ({calculatedPricing.appliedCoupon?.coupon.code || 'COUPON'})</span>
                      <span>-₹{calculatedPricing.couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Show amount after coupon discount */}
                  {calculatedPricing && calculatedPricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Amount after coupon</span>
                      <span>₹{calculatedPricing.amountAfterCoupon.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {calculatedPricing && calculatedPricing.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({(calculatedPricing.taxRate * 100).toFixed(0)}%)</span>
                      <span>₹{calculatedPricing.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {calculatedPricing && calculatedPricing.shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>₹{calculatedPricing.shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Show automatic discounts (calculated on amount after coupon) */}
                  {calculatedPricing && calculatedPricing.automaticDiscounts && calculatedPricing.automaticDiscounts.length > 0 && (
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
                      <span>₹{getFinalTotal().toFixed(2)}</span>
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
                  
                  {/* Proceed to Checkout Button */}
                  <Button 
                    onClick={() => {
                      if (appliedCoupon) {
                        sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
                      }
                      router.push('/checkout');
                    }}
                    className="w-full mt-4"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 