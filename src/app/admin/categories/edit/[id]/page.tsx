'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Category } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !isAdmin) {
      router.push('/auth/login');
      return;
    }

    const fetchCategory = async () => {
      if (!isAdmin) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching category:', id);
        const response = await api.get(`/categories/${id}`);
        const categoryData = response.data;
        setCategory(categoryData);
        setFormData({
          name: categoryData.name,
          description: categoryData.description || '',
          isActive: categoryData.isActive,
        });
      } catch (error: any) {
        console.error('Error fetching category:', error);
        if (error.response?.status === 404) {
          toast.error('Category not found');
        } else if (error.response?.status === 401) {
          toast.error('Authentication required');
          router.push('/auth/login');
        } else {
          toast.error('Failed to fetch category');
        }
        router.push('/admin/categories');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchCategory();
    }
  }, [id, router, isAdmin, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.put(`/categories/${id}`, formData);
      toast.success('Category updated successfully');
      router.push('/admin/categories');
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication required');
        router.push('/auth/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update category');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={() => router.push('/admin/categories')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Category</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter category name"
                required
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                The slug will be automatically updated based on the name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter category description"
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={handleToggleChange}
                disabled={isLoading}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/categories')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Category'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 