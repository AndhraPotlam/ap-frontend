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
import { Plus, Edit, Trash2, Calendar, Percent, DollarSign, Users, Copy, Tag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

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
  applicableCategories?: string[];
  applicableProducts?: string[];
  conditions?: {
    buyQuantity?: number;
    getQuantity?: number;
    bulkThreshold?: number;
    bulkDiscount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminDiscountsPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'buy_x_get_y' | 'bulk',
    value: 0,
    minimumOrderAmount: 0,
    maximumDiscount: 0,
    validFrom: format(new Date(), 'yyyy-MM-dd'),
    validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    usageLimit: 0,
    isActive: true,
    buyQuantity: 0,
    getQuantity: 0,
    bulkThreshold: 0,
    bulkDiscount: 0
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

  // Fetch discounts
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchDiscounts();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/discounts');
      
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data);
      } else {
        setError('Failed to load discounts');
        toast.error('Failed to load discounts');
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      setError('Failed to load discounts');
      toast.error('Failed to load discounts');
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
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimumOrderAmount: 0,
      maximumDiscount: 0,
      validFrom: format(new Date(), 'yyyy-MM-dd'),
      validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      usageLimit: 0,
      isActive: true,
      buyQuantity: 0,
      getQuantity: 0,
      bulkThreshold: 0,
      bulkDiscount: 0
    });
    setEditingDiscount(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.value <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      setError('');

      const discountData = {
        ...formData,
        conditions: {
          buyQuantity: formData.buyQuantity,
          getQuantity: formData.getQuantity,
          bulkThreshold: formData.bulkThreshold,
          bulkDiscount: formData.bulkDiscount
        }
      };

      const endpoint = editingDiscount ? `/discounts/${editingDiscount._id}` : '/discounts';
      const method = editingDiscount ? 'PUT' : 'POST';

      const response = await api[method.toLowerCase() as keyof typeof api](endpoint, discountData);

      if (response.ok) {
        const discount = await response.json();
        
        if (editingDiscount) {
          setDiscounts(prev => prev.map(d => d._id === editingDiscount._id ? discount : d));
          toast.success('Discount updated successfully');
        } else {
          setDiscounts(prev => [discount, ...prev]);
          toast.success('Discount created successfully');
        }
        
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save discount');
        toast.error('Failed to save discount');
      }
    } catch (error) {
      console.error('Error saving discount:', error);
      setError('Failed to save discount');
      toast.error('Failed to save discount');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      description: discount.description || '',
      type: discount.type,
      value: discount.value,
      minimumOrderAmount: discount.minimumOrderAmount || 0,
      maximumDiscount: discount.maximumDiscount || 0,
      validFrom: format(new Date(discount.validFrom), 'yyyy-MM-dd'),
      validUntil: format(new Date(discount.validUntil), 'yyyy-MM-dd'),
      usageLimit: discount.usageLimit || 0,
      isActive: discount.isActive,
      buyQuantity: discount.conditions?.buyQuantity || 0,
      getQuantity: discount.conditions?.getQuantity || 0,
      bulkThreshold: discount.conditions?.bulkThreshold || 0,
      bulkDiscount: discount.conditions?.bulkDiscount || 0
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (discountId: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) {
      return;
    }

    try {
      const response = await api.delete(`/discounts/${discountId}`);
      
      if (response.ok) {
        setDiscounts(prev => prev.filter(d => d._id !== discountId));
        toast.success('Discount deleted successfully');
      } else {
        toast.error('Failed to delete discount');
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error('Failed to delete discount');
    }
  };

  const getStatusBadge = (discount: Discount) => {
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validUntil = new Date(discount.validUntil);
    
    if (!discount.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    if (now < validFrom) {
      return <Badge variant="secondary">Upcoming</Badge>;
    }
    
    if (now > validUntil) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage': return 'Percentage Off';
      case 'fixed': return 'Fixed Amount Off';
      case 'buy_x_get_y': return 'Buy X Get Y';
      case 'bulk': return 'Bulk Discount';
      default: return type;
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading discounts...</div>
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
          <h1 className="text-3xl font-bold">Discount Management</h1>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Discount
          </Button>
        </div>

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
                {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Discount Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter discount name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Discount Type *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Off</SelectItem>
                        <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                        <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                        <SelectItem value="bulk">Bulk Discount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter discount description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="value">Discount Value *</Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                      placeholder={formData.type === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                      required
                    />
                  </div>
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

                {/* Conditional fields based on discount type */}
                {formData.type === 'buy_x_get_y' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buyQuantity">Buy Quantity</Label>
                      <Input
                        id="buyQuantity"
                        type="number"
                        min="1"
                        value={formData.buyQuantity}
                        onChange={(e) => handleInputChange('buyQuantity', parseInt(e.target.value) || 0)}
                        placeholder="Enter buy quantity"
                      />
                    </div>
                    <div>
                      <Label htmlFor="getQuantity">Get Quantity</Label>
                      <Input
                        id="getQuantity"
                        type="number"
                        min="1"
                        value={formData.getQuantity}
                        onChange={(e) => handleInputChange('getQuantity', parseInt(e.target.value) || 0)}
                        placeholder="Enter get quantity"
                      />
                    </div>
                  </div>
                )}

                {formData.type === 'bulk' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bulkThreshold">Bulk Threshold</Label>
                      <Input
                        id="bulkThreshold"
                        type="number"
                        min="1"
                        value={formData.bulkThreshold}
                        onChange={(e) => handleInputChange('bulkThreshold', parseInt(e.target.value) || 0)}
                        placeholder="Enter bulk threshold"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulkDiscount">Bulk Discount (%)</Label>
                      <Input
                        id="bulkDiscount"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.bulkDiscount}
                        onChange={(e) => handleInputChange('bulkDiscount', parseFloat(e.target.value) || 0)}
                        placeholder="Enter bulk discount percentage"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Saving...' : (editingDiscount ? 'Update Discount' : 'Create Discount')}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Discounts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.map((discount) => (
            <Card key={discount._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{discount.name}</CardTitle>
                  {getStatusBadge(discount)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{getDiscountTypeLabel(discount.type)}</span>
                </div>

                {discount.description && (
                  <p className="text-sm text-gray-600">{discount.description}</p>
                )}

                <div className="flex items-center gap-2">
                  {discount.type === 'percentage' ? (
                    <Percent className="h-4 w-4 text-green-600" />
                  ) : (
                    <Tag className="h-4 w-4 text-green-600" />
                  )}
                  <span>
                    {discount.value}
                    {discount.type === 'percentage' ? '%' : '₹'} off
                  </span>
                </div>

                {discount.minimumOrderAmount && discount.minimumOrderAmount > 0 && (
                  <p className="text-sm text-gray-500">
                    Min order: ₹{discount.minimumOrderAmount}
                  </p>
                )}

                {discount.type === 'buy_x_get_y' && discount.conditions?.buyQuantity && (
                  <p className="text-sm text-gray-500">
                    Buy {discount.conditions.buyQuantity}, Get {discount.conditions.getQuantity}
                  </p>
                )}

                {discount.type === 'bulk' && discount.conditions?.bulkThreshold && (
                  <p className="text-sm text-gray-500">
                    {discount.conditions.bulkThreshold}+ items: {discount.conditions.bulkDiscount}% off
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(discount.validFrom), 'MMM dd')} - {format(new Date(discount.validUntil), 'MMM dd, yyyy')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>
                    {discount.usedCount} used
                    {discount.usageLimit && discount.usageLimit > 0 && ` / ${discount.usageLimit} limit`}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(discount)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(discount._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {discounts.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No discounts found. Create your first discount!</p>
          </div>
        )}
      </div>
    </div>
  );
}
