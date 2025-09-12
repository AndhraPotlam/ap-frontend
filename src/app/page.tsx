'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Product } from '@/types';
import ProductList from '@/components/ProductList';
import Cart from '@/components/Cart';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ProductWithWarning extends Product {
  imageUrlWarning?: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<ProductWithWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [s3Warning, setS3Warning] = useState(false);
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setS3Warning(false);
        
        const response = await api.get('/products');
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          
          // Check if any products have S3 warnings
          const hasS3Warning = data.products?.some((product: ProductWithWarning) => product.imageUrlWarning);
          if (hasS3Warning) {
            setS3Warning(true);
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* S3 Configuration Warning */}
      {s3Warning && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some product images are using direct URLs due to S3 configuration issues. 
            This may affect image loading performance.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2">
          <ProductList products={products} />
        </div>
        <div className="hidden md:block md:w-80 md:col-span-1">
          <Cart 
            showBackButton={false} 
            showCheckout={true}
            onCheckoutClick={() => {
              if (isAuthenticated) {
                router.push('/dashboard');
              } else {
                router.push('/auth/login');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
