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
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
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
      const response = await api.get('/users/me');
      if (response.data) {
        setUser(response.data);
        return true;
      }
      return false;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token is invalid or expired
        clearAuthState();
        toast.error('Session expired. Please login again.');
        if (!pathname.startsWith('/auth/')) {
          router.replace('/auth/login');
        }
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname, clearAuthState]);

  useEffect(() => {
    const isAuthPage = pathname.startsWith('/auth/');

    if (!isAuthPage) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [pathname, checkAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post('/users/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAuthState();
      router.replace('/auth/login');
    }
  }, [router, clearAuthState]);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, checkAuth, logout }}>
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