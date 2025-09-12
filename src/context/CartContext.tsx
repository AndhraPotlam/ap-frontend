'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/types';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load cart from database
  const loadCart = async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/cart');
      
      if (response.ok) {
        const cartData = await response.json();
        setCartItems(cartData.items || []);
      } else {
        console.error('Failed to load cart');
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart when authentication status changes
  useEffect(() => {
    loadCart();
  }, [isAuthenticated]);

  const addToCart = async (product: Product, quantity: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      const response = await api.post('/cart/add', {
        productId: product._id,
        quantity
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cart.items || []);
        toast.success('Added to cart');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to update cart');
      return;
    }

    if (quantity < 1) return;

    try {
      const response = await api.put('/cart/update', {
        productId,
        quantity
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cart.items || []);
        toast.success('Cart updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to remove items from cart');
      return;
    }

    try {
      const response = await api.delete(`/cart/remove/${productId}`);

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cart.items || []);
        toast.success('Item removed from cart');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to clear cart');
      return;
    }

    try {
      const response = await api.delete('/cart/clear');

      if (response.ok) {
        setCartItems([]);
        toast.success('Cart cleared');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const refreshCart = () => {
    loadCart();
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItems,
      totalPrice,
      isLoading,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 