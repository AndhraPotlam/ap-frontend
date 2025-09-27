'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Search, Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import { RawMaterial } from '@/types';

export default function RawMaterialsPage() {
  const router = useRouter();
  const { user, isAdmin, user: authUser } = useAuth();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isAdminOrEmployee = isAdmin || authUser?.role === 'employee';

  useEffect(() => {
    if (!isAdminOrEmployee) {
      router.push('/dashboard');
      return;
    }
    fetchRawMaterials();
  }, [isAdminOrEmployee, router]);

  const fetchRawMaterials = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter && statusFilter !== 'all') params.append('isActive', statusFilter);

      const response = await api.get(`/raw-materials?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRawMaterials(data.rawMaterials || []);
      }
    } catch (error) {
      console.error('Error fetching raw materials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRawMaterials();
  }, [searchTerm, categoryFilter, statusFilter]);

  const getStockStatus = (current: number, minimum: number) => {
    if (current <= minimum) return { status: 'low', color: 'bg-red-100 text-red-800' };
    if (current <= minimum * 1.5) return { status: 'medium', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'good', color: 'bg-green-100 text-green-800' };
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'vegetables': 'bg-green-100 text-green-800',
      'spices': 'bg-orange-100 text-orange-800',
      'grains': 'bg-yellow-100 text-yellow-800',
      'dairy': 'bg-blue-100 text-blue-800',
      'meat': 'bg-red-100 text-red-800',
      'pantry': 'bg-purple-100 text-purple-800',
      'beverages': 'bg-cyan-100 text-cyan-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (!isAdminOrEmployee) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Raw Material Management</h1>
          <p className="text-gray-600 mt-2">
            Manage ingredients, supplies, and inventory
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/raw-materials')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">Raw Materials</CardTitle>
                <CardDescription>Manage ingredients and supplies</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track ingredients, manage inventory, and monitor costs.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/recipes')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">Recipes</CardTitle>
                <CardDescription>Manage recipes and cooking processes</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create, edit, and organize recipes with ingredients and cooking steps.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/products')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">Product Management</CardTitle>
                <CardDescription>Manage products and categories</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Manage menu items, categories, and product catalog.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search raw materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vegetables">Vegetables</SelectItem>
                <SelectItem value="spices">Spices</SelectItem>
                <SelectItem value="grains">Grains</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
                <SelectItem value="meat">Meat</SelectItem>
                <SelectItem value="pantry">Pantry</SelectItem>
                <SelectItem value="beverages">Beverages</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/raw-materials/low-stock')}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Low Stock
            </Button>
            <Button onClick={() => router.push('/admin/raw-materials/add')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
          </div>
        </div>

        {/* Raw Materials Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rawMaterials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No raw materials found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter || statusFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by adding your first raw material.'}
              </p>
              <Button onClick={() => router.push('/admin/raw-materials/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Raw Material
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rawMaterials.map((material) => {
              const stockStatus = getStockStatus(material.currentStock, material.minimumStock);
              return (
                <Card key={material._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{material.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {material.description || 'No description available'}
                        </CardDescription>
                      </div>
                      <Badge className={getCategoryColor(material.category)}>
                        {material.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Stock Status:</span>
                        <Badge className={stockStatus.color}>
                          {stockStatus.status === 'low' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {stockStatus.status === 'medium' && <TrendingUp className="h-3 w-3 mr-1" />}
                          {material.currentStock} {material.unit}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Min. Stock:</span>
                        <span className="font-medium">{material.minimumStock} {material.unit}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Cost per {material.unit}:</span>
                        <span className="font-medium flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {material.costPerUnit.toFixed(2)}
                        </span>
                      </div>

                      {material.supplier && (
                        <div className="text-sm text-gray-600">
                          <span className="text-gray-500">Supplier:</span> {material.supplier}
                        </div>
                      )}

                      {!material.isActive && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                          Inactive
                        </Badge>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => router.push(`/admin/raw-materials/edit/${material._id}`)}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => router.push(`/admin/raw-materials/edit/${material._id}`)}
                          className="flex-1"
                        >
                          Stock
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
