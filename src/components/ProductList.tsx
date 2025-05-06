'use client';
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Product } from '@/types';
import api from '@/lib/api';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await api.get('/categories');
      setCategories(response.data);
    };
    fetchCategories();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || 
      (typeof product.category === 'string' ? product.category === selectedCategory : product.category._id === selectedCategory);
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  return (
    <div className="lg:col-span-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
          <Input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 border rounded-md px-4 py-2"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-20">
        {filteredProducts.map((product) => {
          const cartItem = cartItems.find((item) => item.product._id === product._id);
          const quantity = cartItem?.quantity || 0;

          return (
            // <Card key={product._id} className="p-4">
            //   <div className="flex flex-col gap-4">
            //     {/* Product Details Row */}
            //     <div className="flex items-center gap-4">
            //       <img
            //         src={product.imageUrl || '/placeholder.png'}
            //         alt={product.name}
            //         className="w-24 h-24 object-cover rounded"
            //       />
            //       <div className="flex-1">
            //         <h3 className="font-medium text-lg">{product.name}</h3>
            //         <p className="text-sm text-muted-foreground">{product.description}</p>
            //         <p className="text-lg font-bold mt-2">₹{product.price}</p>
            //       </div>
            //     </div>

            //     {/* Quantity Controls Row */}
            //     <div className="flex justify-end">
            //       {quantity === 0 ? (
            //         <Button onClick={() => handleAddToCart(product)}>
            //           Add to Cart
            //         </Button>
            //       ) : (
            //         <div className="flex items-center space-x-2">
            //           <Button variant="outline" size="icon" onClick={() => handleQuantityChange(product._id, quantity - 1)}>
            //             <Minus className="h-4 w-4" />
            //           </Button>
            //           <Input
            //             type="number"
            //             min="1"
            //             value={quantity}
            //             onChange={(e) => handleQuantityChange(product._id, parseInt(e.target.value, 10))}
            //             className="w-16 text-center"
            //           />
            //           <Button variant="outline" size="icon" onClick={() => handleQuantityChange(product._id, quantity + 1)}>
            //             <Plus className="h-4 w-4" />
            //           </Button>
            //         </div>
            //       )}
            //     </div>
            //   </div>
            // </Card>
            <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
          );
        })}
      </div>

      {/* Mobile Cart Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden">
        <Link href="/cart">
          <Button className="w-full h-12 bg-primary text-primary-foreground flex items-center justify-center space-x-2 rounded-none shadow-lg">
            <span>Go to Cart ({cartItems.length})</span>
            <ShoppingCart className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
} 