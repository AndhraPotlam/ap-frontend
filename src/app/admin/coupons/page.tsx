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
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Calendar, Percent, Users, Copy, Tag, ArrowLeft, Settings } from 'lucide-react';
import { format } from 'date-fns';

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
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminCouponsPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minimumOrderAmount: 0,
    maximumDiscount: 0,
    validFrom: format(new Date(), 'yyyy-MM-dd'),
    validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    usageLimit: 0,
    isActive: true
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

  // Fetch coupons
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchCoupons();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/coupons');
      
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      } else {
        setError('Failed to load coupons');
        toast.error('Failed to load coupons');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setError('Failed to load coupons');
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minimumOrderAmount: 0,
      maximumDiscount: 0,
      validFrom: format(new Date(), 'yyyy-MM-dd'),
      validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      usageLimit: 0,
      isActive: true
    });
    setEditingCoupon(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || formData.discountValue <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      setError('');

      const endpoint = editingCoupon ? `/coupons/${editingCoupon._id}` : '/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const response = await api[method.toLowerCase() as keyof typeof api](endpoint, formData);

      if (response.ok) {
        const coupon = await response.json();
        
        if (editingCoupon) {
          setCoupons(prev => prev.map(c => c._id === editingCoupon._id ? coupon : c));
          toast.success('Coupon updated successfully');
        } else {
          setCoupons(prev => [coupon, ...prev]);
          toast.success('Coupon created successfully');
        }
        
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save coupon');
        toast.error('Failed to save coupon');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      setError('Failed to save coupon');
      toast.error('Failed to save coupon');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount || 0,
      maximumDiscount: coupon.maximumDiscount || 0,
      validFrom: format(new Date(coupon.validFrom), 'yyyy-MM-dd'),
      validUntil: format(new Date(coupon.validUntil), 'yyyy-MM-dd'),
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      const response = await api.delete(`/coupons/${couponId}`);
      
      if (response.ok) {
        setCoupons(prev => prev.filter(c => c._id !== couponId));
        toast.success('Coupon deleted successfully');
      } else {
        toast.error('Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Coupon code copied to clipboard');
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    if (now < validFrom) {
      return <Badge variant="secondary">Upcoming</Badge>;
    }
    
    if (now > validUntil) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading coupons...</div>
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Price Management</h1>
          <Button onClick={() => router.push('/admin/price-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Price Management
          </Button>
        </div>

        <Alert className="mb-8">
          <AlertDescription>
            Coupons have been moved to the new <strong>Price Management</strong> section. 
            Click the button above to access the unified price management interface.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Coupon Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Coupon Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter coupon name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter coupon description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="discountType">Discount Type *</Label>
                    <Select 
                      value={formData.discountType} 
                      onValueChange={(value) => handleInputChange('discountType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discountValue">Discount Value *</Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountValue}
                      onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                      placeholder={formData.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maximumDiscount">Maximum Discount</Label>
                    <Input
                      id="maximumDiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maximumDiscount}
                      onChange={(e) => handleInputChange('maximumDiscount', parseFloat(e.target.value) || 0)}
                      placeholder="Enter maximum discount"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="minimumOrderAmount">Minimum Order Amount</Label>
                    <Input
                      id="minimumOrderAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minimumOrderAmount}
                      onChange={(e) => handleInputChange('minimumOrderAmount', parseFloat(e.target.value) || 0)}
                      placeholder="Enter minimum order amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validFrom">Valid From *</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => handleInputChange('validFrom', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until *</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => handleInputChange('validUntil', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="usageLimit">Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="0"
                      value={formData.usageLimit}
                      onChange={(e) => handleInputChange('usageLimit', parseInt(e.target.value) || 0)}
                      placeholder="Enter usage limit (0 = unlimited)"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Coupons List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{coupon.name}</CardTitle>
                  {getStatusBadge(coupon)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {coupon.code}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(coupon.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {coupon.description && (
                  <p className="text-sm text-gray-600">{coupon.description}</p>
                )}

                <div className="flex items-center gap-2">
                  {coupon.discountType === 'percentage' ? (
                    <Percent className="h-4 w-4 text-green-600" />
                  ) : (
                    <Tag className="h-4 w-4 text-green-600" />
                  )}
                  <span>
                    {coupon.discountValue}
                    {coupon.discountType === 'percentage' ? '%' : '₹'} off
                  </span>
                </div>

                {coupon.minimumOrderAmount && coupon.minimumOrderAmount > 0 && (
                  <div className="text-sm text-gray-600">
                    Min order: ₹{coupon.minimumOrderAmount}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(coupon.validFrom), 'MMM dd')} - {format(new Date(coupon.validUntil), 'MMM dd, yyyy')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>
                    {coupon.usedCount || 0} used
                    {coupon.usageLimit && ` / ${coupon.usageLimit || '∞'} limit`}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(coupon._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {coupons.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No coupons found. Create your first coupon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
