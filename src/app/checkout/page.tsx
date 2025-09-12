'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { ShoppingCart, MapPin, CreditCard, CheckCircle, Package, Edit } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { cartItems, clearCart, totalPrice, totalItems, isLoading: cartLoading } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculatedPricing, setCalculatedPricing] = useState<any>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);

  // Applied coupon from cart
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

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

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (totalItems === 0) {
      router.push('/cart');
      return;
    }
  }, [isAuthenticated, totalItems, router]);

  // Load applied coupon from sessionStorage
  useEffect(() => {
    const storedCoupon = sessionStorage.getItem('appliedCoupon');
    if (storedCoupon) {
      try {
        const coupon = JSON.parse(storedCoupon);
        setAppliedCoupon(coupon);
      } catch (error) {
        console.error('Error parsing stored coupon:', error);
      }
    }
  }, []);

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    setError('');

    try {
      const orderData = {
        items: cartItems.map((item: any) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        })),
        shippingDetails: {
          type: 'take-in',
          address: 'Store Pickup',
          city: 'Local Store',
          state: 'Andhra Pradesh',
          zipCode: '500000',
          country: 'India'
        },
        paymentDetails: {
          method: 'COD',
          status: 'pending'
        },
        // Send only the coupon code, backend will calculate everything
        couponCode: appliedCoupon ? appliedCoupon.coupon.code : null,
        status: 'pending'
      };

      console.log('Sending order data to backend:', orderData);

      const response = await api.post('/orders', orderData);

      if (response.ok) {
        const order = await response.json();
        toast.success('Order placed successfully!');
        clearCart();
        // Clear applied coupon from sessionStorage
        sessionStorage.removeItem('appliedCoupon');
        router.push(`/orders?orderId=${order._id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to place order');
        toast.error('Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place order');
      toast.error('Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || totalItems === 0) {
    return null;
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
          
          {error && (
            <Alert className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="space-y-6">
              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Take-in (Store Pickup)</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      You can collect your order from our local store. We'll notify you when your order is ready for pickup.
                    </p>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Pickup Address:</strong><br />
                        Andhra Potlam Store<br />
                        Main Street, Andhra Pradesh<br />
                        India - 500000
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Cash on Delivery (COD)</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pay with cash when you collect your order from our store.
                    </p>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Payment:</strong> Cash on pickup<br />
                        <strong>No advance payment required</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.product._id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">₹{item.product.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>

                  {/* Edit Cart Button */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/cart')}
                      className="w-full"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Cart
                    </Button>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{calculatedPricing ? calculatedPricing.subtotal.toFixed(2) : '0.00'}</span>
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
                    
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{calculatedPricing?.shippingCost === 0 ? 'Free (Take-in)' : `₹${calculatedPricing?.shippingCost.toFixed(2) || '0.00'}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({calculatedPricing?.taxRate > 0 ? `${(calculatedPricing.taxRate * 100).toFixed(0)}%` : '0%'})</span>
                      <span>₹{calculatedPricing?.taxAmount.toFixed(2) || '0.00'}</span>
                    </div>
                    
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
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{calculatedPricing ? calculatedPricing.finalTotal.toFixed(2) : '0.00'}</span>
                    </div>
                    
                    {calculatedPricing && (calculatedPricing.couponDiscount > 0 || calculatedPricing.totalAutomaticDiscount > 0) && (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded text-center">
                        <p>🎉 You saved ₹{(calculatedPricing.couponDiscount + calculatedPricing.totalAutomaticDiscount).toFixed(2)}!</p>
                      </div>
                    )}
                    {isLoadingPricing && (
                      <p className="text-xs text-gray-500 text-center">
                        Calculating pricing...
                      </p>
                    )}
                  </div>

                  {/* Place Order Button */}
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Place Order
                      </div>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By placing your order, you agree to our terms and conditions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
