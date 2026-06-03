'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Category } from '@/types';
import Image from 'next/image';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    imageUrl: '',
    isActive: true,
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productResponse, categoriesResponse] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/categories')
        ]);
        
        if (productResponse.ok && categoriesResponse.ok) {
          const product = await productResponse.json();
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
          
          setFormData({
            name: product.name,
            description: product.description,
            category: product.category._id,
            price: product.price.toString(),
            stock: product.stock.toString(),
            imageUrl: product.imageUrl,
            isActive: product.isActive,
          });
        } else {
          toast.error('Failed to fetch product data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch product data');
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    setImageError(false);
  }, [formData.imageUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      try {
        // Upload image through backend
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await api.postForm('/upload/image', formData);
        
        if (response.ok) {
          const data = await response.json();
          // Update form data with the actual S3 URL
          setFormData(prev => ({
            ...prev,
            imageUrl: data.imageUrl
          }));
          setImageError(false);
          setSelectedFile(null);
          e.target.value = ''; // Reset the file input
          toast.success('Image uploaded successfully');
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || 'Failed to upload image');
          e.target.value = '';
          setSelectedFile(null);
        }
      } catch (error: any) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
        // Reset the file input
        e.target.value = '';
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };

      const response = await api.put(`/products/${id}`, productData);
      if (response.ok) {
        toast.success('Product updated successfully');
        router.push('/admin/inventory');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update product');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/admin/products')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                {formData.imageUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Current image:</p>
                    <div className="relative h-48 w-48">
                      {!imageError ? (
                        <Image
                          loader={({ src }) => src}
                          src={formData.imageUrl}
                          key={formData.imageUrl}
                          alt="Current product"
                          fill
                          className="object-cover rounded-lg"
                          onError={() => setImageError(true)}
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-500">Image not available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/inventory')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 