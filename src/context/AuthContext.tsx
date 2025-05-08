'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isAuthenticated: false,
  checkAuth: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsLoading(false);
    
    // Clear all cookies
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users/me');
      
      if (response.data) {
        setUser(response.data);
        return true;
      }
      
      clearAuthState();
      return false;
    } catch (error: any) {
      console.error('Auth check error:', error);
      
      if (error.response?.status === 401) {
        clearAuthState();
        if (!pathname.startsWith('/auth/')) {
          router.replace('/auth/login');
        }
      } else {
        toast.error('Failed to check authentication status');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname, clearAuthState]);

  // Initial auth check
  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, []); // Only run on mount

  // Handle auth page redirects
  useEffect(() => {
    const isAuthPage = pathname.startsWith('/auth/');
    
    if (isAuthPage && user) {
      router.replace('/');
    }
  }, [pathname, user, router]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.post('/users/logout');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      clearAuthState();
      router.replace('/auth/login');
    }
  }, [router, clearAuthState]);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAdmin, 
        isAuthenticated, 
        checkAuth, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}