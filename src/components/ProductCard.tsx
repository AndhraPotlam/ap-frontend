'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { Product } from '@/types';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity(prev => (prev > 0 ? prev - 1 : 0));
  };
  console.log(quantity);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    console.log(quantity);
    if (quantity > 0) {
      onAddToCart(product, quantity);
      setQuantity(0);
    }
  };

  return (
    <Card className="h-full shadow-md">
      <div className="flex flex-col">
        <div className="flex flex-row items-center gap-4 h-24">
          <div className="w-24 sm:w-32 aspect-square relative shrink-0">
            <Image
              src={product.imageUrl || '/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <CardHeader className="p-0">
              <CardTitle className="line-clamp-1 text-lg sm:text-xl">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              <p className="text-lg font-semibold">₹{product.price}</p>
              <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 overflow-ellipsis" >
                {product.description}
              </p>
            </CardContent>
          </div>
        </div>
        <div className="flex flex-row items-center justify-end space-x-2 mt-2 ml-2 mr-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              className="h-8 w-8"
              disabled={quantity === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground font-bold px-2">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={handleAddToCart}
            className="rounded-lg py-2"
            disabled={quantity === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Card>
  );
}