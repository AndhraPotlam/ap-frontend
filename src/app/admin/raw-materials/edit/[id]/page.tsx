'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Package, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function EditRawMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin, user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'vegetables',
    unit: '',
    costPerUnit: 0,
    supplier: '',
    minimumStock: 0,
    currentStock: 0,
    isActive: true
  });

  const isAdminOrEmployee = isAdmin || authUser?.role === 'employee';
  const materialId = params.id as string;

  useEffect(() => {
    if (!isAdminOrEmployee) {
      router.push('/dashboard');
      return;
    }
    if (materialId) {
      fetchRawMaterial();
    }
  }, [isAdminOrEmployee, router, materialId]);

  const fetchRawMaterial = async () => {
    try {
      const response = await api.get(`/raw-materials/${materialId}`);
      if (response.ok) {
        const data = await response.json();
        const material = data.rawMaterial;
        setForm({
          name: material.name || '',
          description: material.description || '',
          category: material.category || 'vegetables',
          unit: material.unit || '',
          costPerUnit: material.costPerUnit || 0,
          supplier: material.supplier || '',
          minimumStock: material.minimumStock || 0,
          currentStock: material.currentStock || 0,
          isActive: material.isActive !== false
        });
      } else {
        toast.error('Failed to load raw material');
        router.push('/admin/raw-materials');
      }
    } catch (error) {
      console.error('Error fetching raw material:', error);
      toast.error('Failed to load raw material');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.put(`/raw-materials/${materialId}`, form);
      if (response.ok) {
        toast.success('Raw material updated successfully');
        router.push('/admin/raw-materials');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update raw material');
      }
    } catch (error) {
      console.error('Error updating raw material:', error);
      toast.error('Failed to update raw material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this raw material? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await api.delete(`/raw-materials/${materialId}`);
      if (response.ok) {
        toast.success('Raw material deleted successfully');
        router.push('/admin/raw-materials');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete raw material');
      }
    } catch (error) {
      console.error('Error deleting raw material:', error);
      toast.error('Failed to delete raw material');
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdminOrEmployee) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/raw-materials')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Raw Materials
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Raw Material</h1>
              <p className="text-gray-600 mt-2">
                Update material details, pricing, and inventory information
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Material
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Material details and specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Material Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Onions, Rice, Olive Oil"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetables">Vegetables</SelectItem>
                      <SelectItem value="spices">Spices</SelectItem>
                      <SelectItem value="grains">Grains</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                      <SelectItem value="meat">Meat</SelectItem>
                      <SelectItem value="pantry">Pantry</SelectItem>
                      <SelectItem value="beverages">Beverages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the material, quality, or any special notes..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="e.g., kg, g, l, ml, pieces, cups"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    placeholder="Supplier name or company"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost & Inventory</CardTitle>
              <CardDescription>Pricing and stock management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="costPerUnit">Cost per Unit *</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPerUnit}
                    onChange={(e) => setForm({ ...form, costPerUnit: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minimumStock">Minimum Stock *</Label>
                  <Input
                    id="minimumStock"
                    type="number"
                    min="0"
                    value={form.minimumStock}
                    onChange={(e) => setForm({ ...form, minimumStock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currentStock">Current Stock *</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    min="0"
                    value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">Active (available for use)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/raw-materials')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Raw Material
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
