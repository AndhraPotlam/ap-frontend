'use client';
import React from 'react';
import Cart from '@/components/Cart';

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Cart showBackButton={true} showCheckout={true} />
    </div>
  );
} 