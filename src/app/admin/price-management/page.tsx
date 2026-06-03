'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  DollarSign, 
  Percent, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RefreshCw,
  Calendar,
  Users,
  Copy,
  Tag,
  Truck,
  CreditCard,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Package,
  Clock,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';

interface Setting {
  _id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  isActive: boolean;
}

interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Discount {
  _id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'bulk';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PriceManagementPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  
  // Settings state
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minimumOrderAmount: 0,
    maximumDiscount: 0,
    validFrom: '',
    validUntil: '',
    usageLimit: 0,
    isActive: true
  });
  
  // Discounts state
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'buy_x_get_y' | 'bulk',
    value: 0,
    minimumOrderAmount: 0,
    maximumDiscount: 0,
    validFrom: '',
    validUntil: '',
    usageLimit: 0,
    isActive: true
  });

  // UI state for responsive design
  const [expandedSections, setExpandedSections] = useState({
    pricing: true,
    coupons: false,
    discounts: false
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    
    if (!isAdmin) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, isAdmin, router]);

  // Load data
  useEffect(() => {
    if (isAdmin) {
      loadSettings();
      loadCoupons();
      loadDiscounts();
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data || []);
      } else {
        setError('Failed to load settings');
      }
    } catch (error) {
      setError('Failed to load settings');
    }
  };

  const loadCoupons = async () => {
    try {
      const response = await api.get('/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data || []);
      }
    } catch (error) {
      console.error('Failed to load coupons:', error);
    }
  };

  const loadDiscounts = async () => {
    try {
      const response = await api.get('/discounts');
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data || []);
      }
    } catch (error) {
      console.error('Failed to load discounts:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await api.put('/settings', { settings });
      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
  };

  const initializeDefaultSettings = async () => {
    try {
      const response = await api.post('/settings/initialize');
      if (response.ok) {
        await loadSettings();
        toast.success('Default settings initialized');
      } else {
        toast.error('Failed to initialize settings');
      }
    } catch (error) {
      toast.error('Failed to initialize settings');
    }
  };

  // Coupon functions
  const saveCoupon = async () => {
    try {
      const url = editingCoupon ? `/coupons/${editingCoupon._id}` : '/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(couponForm)
      });

      if (response.ok) {
        toast.success(editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully');
        setShowCouponForm(false);
        setEditingCoupon(null);
        resetCouponForm();
        loadCoupons();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save coupon');
      }
    } catch (error) {
      toast.error('Failed to save coupon');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        toast.success('Coupon deleted successfully');
        loadCoupons();
      } else {
        toast.error('Failed to delete coupon');
      }
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const editCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount || 0,
      maximumDiscount: coupon.maximumDiscount || 0,
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil.split('T')[0],
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive
    });
    setShowCouponForm(true);
    setExpandedSections(prev => ({ ...prev, coupons: true }));
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minimumOrderAmount: 0,
      maximumDiscount: 0,
      validFrom: '',
      validUntil: '',
      usageLimit: 0,
      isActive: true
    });
  };

  // Discount functions
  const saveDiscount = async () => {
    try {
      const url = editingDiscount ? `/discounts/${editingDiscount._id}` : '/discounts';
      const method = editingDiscount ? 'PUT' : 'POST';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(discountForm)
      });

      if (response.ok) {
        toast.success(editingDiscount ? 'Discount updated successfully' : 'Discount created successfully');
        setShowDiscountForm(false);
        setEditingDiscount(null);
        resetDiscountForm();
        loadDiscounts();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save discount');
      }
    } catch (error) {
      toast.error('Failed to save discount');
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/discounts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        toast.success('Discount deleted successfully');
        loadDiscounts();
      } else {
        toast.error('Failed to delete discount');
      }
    } catch (error) {
      toast.error('Failed to delete discount');
    }
  };

  const editDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setDiscountForm({
      name: discount.name,
      description: discount.description || '',
      type: discount.type,
      value: discount.value,
      minimumOrderAmount: discount.minimumOrderAmount || 0,
      maximumDiscount: discount.maximumDiscount || 0,
      validFrom: discount.validFrom.split('T')[0],
      validUntil: discount.validUntil.split('T')[0],
      usageLimit: discount.usageLimit || 0,
      isActive: discount.isActive
    });
    setShowDiscountForm(true);
    setExpandedSections(prev => ({ ...prev, discounts: true }));
  };

  const resetDiscountForm = () => {
    setDiscountForm({
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimumOrderAmount: 0,
      maximumDiscount: 0,
      validFrom: '',
      validUntil: '',
      usageLimit: 0,
      isActive: true
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header with gradient background */}
        <div className="mb-6 sm:mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 mb-4 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Price Management
                </h1>
                <p className="text-gray-600 mt-2">Configure pricing, shipping, coupons, and discounts</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={initializeDefaultSettings} 
                  size="sm"
                  className="bg-white/50 hover:bg-white/80"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Initialize Defaults
                </Button>
                <Button 
                  onClick={saveSettings} 
                  disabled={isSaving} 
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Settings */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader 
            className="cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg"
            onClick={() => toggleSection('pricing')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Pricing & Shipping Settings</h3>
                  <p className="text-emerald-100 text-sm">Configure tax rates, shipping costs, and delivery settings</p>
                </div>
              </div>
              {expandedSections.pricing ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardTitle>
          </CardHeader>
          {expandedSections.pricing && (
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pricing Settings */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-semibold text-gray-800">Pricing Configuration</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Label htmlFor="taxRate" className="text-sm font-medium text-gray-700">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        value={settings.find(s => s.key === 'taxRate')?.value || 0}
                        onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) || 0)}
                        className="mt-1 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div className="relative">
                      <Label htmlFor="currency" className="text-sm font-medium text-gray-700">Currency</Label>
                      <Input
                        id="currency"
                        value={settings.find(s => s.key === 'currency')?.value || 'INR'}
                        onChange={(e) => updateSetting('currency', e.target.value)}
                        className="mt-1 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Settings */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Shipping Configuration</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Label htmlFor="shippingCost" className="text-sm font-medium text-gray-700">Shipping Cost (₹)</Label>
                      <Input
                        id="shippingCost"
                        type="number"
                        step="0.01"
                        value={settings.find(s => s.key === 'shippingCost')?.value || 0}
                        onChange={(e) => updateSetting('shippingCost', parseFloat(e.target.value) || 0)}
                        className="mt-1 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="relative">
                      <Label htmlFor="freeShippingThreshold" className="text-sm font-medium text-gray-700">Free Shipping Threshold (₹)</Label>
                      <Input
                        id="freeShippingThreshold"
                        type="number"
                        step="0.01"
                        value={settings.find(s => s.key === 'freeShippingThreshold')?.value || 0}
                        onChange={(e) => updateSetting('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                        className="mt-1 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="relative">
                      <Label htmlFor="shippingMethod" className="text-sm font-medium text-gray-700">Default Shipping Method</Label>
                      <Input
                        id="shippingMethod"
                        value={settings.find(s => s.key === 'shippingMethod')?.value || 'Standard'}
                        onChange={(e) => updateSetting('shippingMethod', e.target.value)}
                        placeholder="Standard"
                        className="mt-1 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="relative">
                      <Label htmlFor="shippingTime" className="text-sm font-medium text-gray-700">Estimated Shipping Time (days)</Label>
                      <Input
                        id="shippingTime"
                        type="number"
                        value={settings.find(s => s.key === 'shippingTime')?.value || 3}
                        onChange={(e) => updateSetting('shippingTime', parseInt(e.target.value) || 3)}
                        className="mt-1 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Coupons Section */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader 
            className="cursor-pointer bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg"
            onClick={() => toggleSection('coupons')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Percent className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Coupons ({coupons.length})</h3>
                  <p className="text-red-100 text-sm">Create and manage promotional coupon codes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCouponForm(true);
                    setExpandedSections(prev => ({ ...prev, coupons: true }));
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Create Coupon</span>
                </Button>
                {expandedSections.coupons ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          {expandedSections.coupons && (
            <CardContent className="p-6">
              {showCouponForm && (
                <Card className="mb-6 border-2 border-red-200 bg-red-50/50">
                  <CardHeader className="bg-red-100/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-red-800">
                        {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setShowCouponForm(false);
                          setEditingCoupon(null);
                          resetCouponForm();
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="couponCode" className="text-sm font-medium">Coupon Code</Label>
                        <Input
                          id="couponCode"
                          value={couponForm.code}
                          onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                          placeholder="SAVE20"
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="couponName" className="text-sm font-medium">Name</Label>
                        <Input
                          id="couponName"
                          value={couponForm.name}
                          onChange={(e) => setCouponForm({...couponForm, name: e.target.value})}
                          placeholder="20% Off"
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="couponDescription" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="couponDescription"
                        value={couponForm.description}
                        onChange={(e) => setCouponForm({...couponForm, description: e.target.value})}
                        placeholder="Get 20% off on your order"
                        rows={2}
                        className="mt-1 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="couponDiscountType" className="text-sm font-medium">Discount Type</Label>
                        <Select value={couponForm.discountType} onValueChange={(value: 'percentage' | 'fixed') => setCouponForm({...couponForm, discountType: value})}>
                          <SelectTrigger className="mt-1 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="couponDiscountValue" className="text-sm font-medium">Discount Value</Label>
                        <Input
                          id="couponDiscountValue"
                          type="number"
                          step="0.01"
                          value={couponForm.discountValue}
                          onChange={(e) => setCouponForm({...couponForm, discountValue: parseFloat(e.target.value) || 0})}
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="couponMinAmount" className="text-sm font-medium">Minimum Order Amount</Label>
                        <Input
                          id="couponMinAmount"
                          type="number"
                          step="0.01"
                          value={couponForm.minimumOrderAmount}
                          onChange={(e) => setCouponForm({...couponForm, minimumOrderAmount: parseFloat(e.target.value) || 0})}
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="couponMaxDiscount" className="text-sm font-medium">Maximum Discount</Label>
                        <Input
                          id="couponMaxDiscount"
                          type="number"
                          step="0.01"
                          value={couponForm.maximumDiscount}
                          onChange={(e) => setCouponForm({...couponForm, maximumDiscount: parseFloat(e.target.value) || 0})}
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="couponValidFrom" className="text-sm font-medium">Valid From</Label>
                        <Input
                          id="couponValidFrom"
                          type="date"
                          value={couponForm.validFrom}
                          onChange={(e) => setCouponForm({...couponForm, validFrom: e.target.value})}
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="couponValidUntil" className="text-sm font-medium">Valid Until</Label>
                        <Input
                          id="couponValidUntil"
                          type="date"
                          value={couponForm.validUntil}
                          onChange={(e) => setCouponForm({...couponForm, validUntil: e.target.value})}
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="couponActive"
                          checked={couponForm.isActive}
                          onCheckedChange={(checked) => setCouponForm({...couponForm, isActive: checked})}
                        />
                        <Label htmlFor="couponActive" className="text-sm font-medium">Active</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                          setShowCouponForm(false);
                          setEditingCoupon(null);
                          resetCouponForm();
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={saveCoupon}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                        >
                          {editingCoupon ? 'Update' : 'Create'} Coupon
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <Card key={coupon._id} className="border border-red-100 hover:border-red-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge 
                              variant={coupon.isActive ? "default" : "secondary"}
                              className={coupon.isActive ? "bg-red-500 hover:bg-red-600" : ""}
                            >
                              {coupon.code}
                            </Badge>
                            <span className="font-semibold truncate text-gray-800">{coupon.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(coupon.code)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {coupon.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{coupon.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                            <span className="font-medium text-red-600">
                              {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} off
                            </span>
                            <span>Used: {coupon.usedCount}/{coupon.usageLimit || '∞'}</span>
                            <span className="hidden sm:inline">
                              Valid: {format(new Date(coupon.validFrom), 'MMM dd')} - {format(new Date(coupon.validUntil), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => editCoupon(coupon)} className="border-red-200 text-red-600 hover:bg-red-50">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteCoupon(coupon._id)} className="border-red-200 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {coupons.length === 0 && (
                  <div className="text-center py-12">
                    <Percent className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No coupons created yet</p>
                    <p className="text-gray-400 text-sm">Create your first promotional coupon to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Discounts Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader 
            className="cursor-pointer bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg"
            onClick={() => toggleSection('discounts')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Percent className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Automatic Discounts ({discounts.length})</h3>
                  <p className="text-yellow-100 text-sm">Set up automatic discount rules and promotions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDiscountForm(true);
                    setExpandedSections(prev => ({ ...prev, discounts: true }));
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Create Discount</span>
                </Button>
                {expandedSections.discounts ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          {expandedSections.discounts && (
            <CardContent className="p-6">
              {showDiscountForm && (
                <Card className="mb-6 border-2 border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="bg-yellow-100/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-yellow-800">
                        {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setShowDiscountForm(false);
                          setEditingDiscount(null);
                          resetDiscountForm();
                        }}
                        className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discountName" className="text-sm font-medium">Name</Label>
                        <Input
                          id="discountName"
                          value={discountForm.name}
                          onChange={(e) => setDiscountForm({...discountForm, name: e.target.value})}
                          placeholder="Bulk Discount"
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discountType" className="text-sm font-medium">Type</Label>
                        <Select value={discountForm.type} onValueChange={(value: 'percentage' | 'fixed' | 'buy_x_get_y' | 'bulk') => setDiscountForm({...discountForm, type: value})}>
                          <SelectTrigger className="mt-1 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                            <SelectItem value="bulk">Bulk Discount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="discountDescription" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="discountDescription"
                        value={discountForm.description}
                        onChange={(e) => setDiscountForm({...discountForm, description: e.target.value})}
                        placeholder="Automatic discount for bulk orders"
                        rows={2}
                        className="mt-1 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discountValue" className="text-sm font-medium">Discount Value</Label>
                        <Input
                          id="discountValue"
                          type="number"
                          step="0.01"
                          value={discountForm.value}
                          onChange={(e) => setDiscountForm({...discountForm, value: parseFloat(e.target.value) || 0})}
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discountMinAmount" className="text-sm font-medium">Minimum Order Amount</Label>
                        <Input
                          id="discountMinAmount"
                          type="number"
                          step="0.01"
                          value={discountForm.minimumOrderAmount}
                          onChange={(e) => setDiscountForm({...discountForm, minimumOrderAmount: parseFloat(e.target.value) || 0})}
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discountValidFrom" className="text-sm font-medium">Valid From</Label>
                        <Input
                          id="discountValidFrom"
                          type="date"
                          value={discountForm.validFrom}
                          onChange={(e) => setDiscountForm({...discountForm, validFrom: e.target.value})}
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discountValidUntil" className="text-sm font-medium">Valid Until</Label>
                        <Input
                          id="discountValidUntil"
                          type="date"
                          value={discountForm.validUntil}
                          onChange={(e) => setDiscountForm({...discountForm, validUntil: e.target.value})}
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="discountActive"
                          checked={discountForm.isActive}
                          onCheckedChange={(checked) => setDiscountForm({...discountForm, isActive: checked})}
                        />
                        <Label htmlFor="discountActive" className="text-sm font-medium">Active</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                          setShowDiscountForm(false);
                          setEditingDiscount(null);
                          resetDiscountForm();
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={saveDiscount}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          {editingDiscount ? 'Update' : 'Create'} Discount
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {discounts.map((discount) => (
                  <Card key={discount._id} className="border border-yellow-100 hover:border-yellow-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge 
                              variant={discount.isActive ? "default" : "secondary"}
                              className={discount.isActive ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                            >
                              {discount.type}
                            </Badge>
                            <span className="font-semibold truncate text-gray-800">{discount.name}</span>
                          </div>
                          {discount.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{discount.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                            <span className="font-medium text-yellow-600">
                              {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`} off
                            </span>
                            <span>Used: {discount.usedCount}/{discount.usageLimit || '∞'}</span>
                            <span className="hidden sm:inline">
                              Valid: {format(new Date(discount.validFrom), 'MMM dd')} - {format(new Date(discount.validUntil), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => editDiscount(discount)} className="border-yellow-200 text-yellow-600 hover:bg-yellow-50">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteDiscount(discount._id)} className="border-yellow-200 text-yellow-600 hover:bg-yellow-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {discounts.length === 0 && (
                  <div className="text-center py-12">
                    <Percent className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No automatic discounts created yet</p>
                    <p className="text-gray-400 text-sm">Create your first automatic discount rule to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}