'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, Package, TrendingUp, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import { RawMaterial } from '@/types';
import { toast } from 'sonner';

export default function LowStockPage() {
  const router = useRouter();
  const { user, isAdmin, user: authUser } = useAuth();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminOrEmployee = isAdmin || authUser?.role === 'employee';

  useEffect(() => {
    if (!isAdminOrEmployee) {
      router.push('/dashboard');
      return;
    }
    fetchLowStockItems();
  }, [isAdminOrEmployee, router]);

  const fetchLowStockItems = async () => {
    try {
      const response = await api.get('/raw-materials/low-stock');
      if (response.ok) {
        const data = await response.json();
        setRawMaterials(data.rawMaterials || []);
      } else {
        toast.error('Failed to fetch low stock items');
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      toast.error('Failed to fetch low stock items');
    } finally {
      setLoading(false);
    }
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

  const getStockStatus = (current: number, minimum: number) => {
    if (current <= 0) return { status: 'out', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (current <= minimum) return { status: 'low', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (current <= minimum * 1.5) return { status: 'medium', color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp };
    return { status: 'good', color: 'bg-green-100 text-green-800', icon: TrendingUp };
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
              onClick={() => router.push('/admin/raw-materials')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Raw Materials
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Low Stock Alert</h1>
          <p className="text-gray-600 mt-2">
            Materials that are running low or out of stock
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-red-600">Critical Stock</p>
                  <p className="text-2xl font-bold text-red-900">
                    {rawMaterials.filter(m => m.currentStock <= 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-yellow-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {rawMaterials.filter(m => m.currentStock > 0 && m.currentStock <= m.minimumStock).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {rawMaterials.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Items */}
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
              <Package className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Stock Levels Good!</h3>
              <p className="text-gray-600 mb-4">
                No materials are currently running low on stock.
              </p>
              <Button onClick={() => router.push('/admin/raw-materials')}>
                View All Materials
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rawMaterials.map((material) => {
              const stockStatus = getStockStatus(material.currentStock, material.minimumStock);
              const StatusIcon = stockStatus.icon;
              
              return (
                <Card key={material._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/admin/raw-materials/edit/${material._id}`)}>
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
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {stockStatus.status === 'out' ? 'Out of Stock' : 
                           stockStatus.status === 'low' ? 'Low Stock' : 
                           stockStatus.status === 'medium' ? 'Medium Stock' : 'Good Stock'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Current Stock:</span>
                        <span className="font-medium text-red-600">{material.currentStock} {material.unit}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Min. Required:</span>
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

                      {material.currentStock <= 0 && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                          <strong>⚠️ URGENT:</strong> This item is out of stock!
                        </div>
                      )}

                      {material.currentStock > 0 && material.currentStock <= material.minimumStock && (
                        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded text-sm text-yellow-800">
                          <strong>⚠️ WARNING:</strong> Stock is below minimum level!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {rawMaterials.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <Button onClick={() => router.push('/admin/raw-materials')} variant="outline">
              View All Materials
            </Button>
            <Button onClick={() => router.push('/admin/raw-materials/add')}>
              Add New Material
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
