'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, ArrowLeft, Tag, ChefHat, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Category } from '@/types';
import Image from 'next/image';

// Define a type for the product object
interface Product {
  id: number;
  name: string;
  category: Category;
  price: number;
  stock: number;
  isActive: boolean;
  _id?: string;
  imageUrl: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (productId: string | undefined) => {
    try {
      if (!productId) {
        toast.error('Product ID is missing');
        return;
      }
      await api.delete(`/products/${productId}`);
      setProducts(products.filter(product => product._id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  useEffect(() => {
    // Fetch products from API 
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(Array.isArray(data.products) ? data.products : []);
        } else {
          setError('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);


  const getStatusColor = (isActive: boolean) => {
    switch (isActive) {
      case true:
        return 'bg-green-500';
      case false:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto py-6">
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Button onClick={() => router.push('/admin/products/add')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/products')}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Package className="h-6 w-6 text-indigo-600" />
            <div className="ml-3">
              <CardTitle className="text-base">Products</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Manage product catalog
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/categories')}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Tag className="h-6 w-6 text-pink-600" />
            <div className="ml-3">
              <CardTitle className="text-base">Categories</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Organize product categories
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/recipes')}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <div className="ml-3">
              <CardTitle className="text-base">Recipe Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Manage recipes and cooking processes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={product._id || `${product.name}-${index}`}>
                    <TableCell>
                      {product.imageUrl && (
                        <div className="relative h-12 w-12">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell>₹{product.price}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(product.isActive)}>
                        {product.isActive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/products/edit/${product._id}`)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => product._id && handleDelete(product._id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}