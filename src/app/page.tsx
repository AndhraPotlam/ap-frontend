'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Product } from '@/types';
import ProductList from '@/components/ProductList';
import Cart from '@/components/Cart';
import { useCart } from '@/context/CartContext';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { cartItems } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2">
          <ProductList products={products} />
        </div>
        <div className="hidden md:block md:w-80 md:col-span-1">
          <Cart showBackButton={false} showCheckout={true} />
        </div>
      </div>
    </div>
  );
}
