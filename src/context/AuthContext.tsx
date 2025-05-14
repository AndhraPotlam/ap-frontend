'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Clear cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users/me');
      if (response.status === 200 && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        // Set role cookie
        document.cookie = `role=${response.data.role}; path=/;`;
        return true;
      }
      clearAuthState();
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      clearAuthState();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.post('/users/logout');
      clearAuthState();
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state only once
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
      setIsInitialized(true);
    };

    initializeAuth();
  }, []); // Empty dependency array means this runs once on mount

  // Handle auth redirects
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const isPublicPath = pathname.startsWith('/auth/');

    // Only redirect if we're on a public path and authenticated
    if (isAuthenticated && isPublicPath) {
      router.replace('/');
    }
  }, [isInitialized, isAuthenticated, pathname, router, isLoading]);

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return null;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      isAdmin,
      isLoading,
      checkAuth, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}