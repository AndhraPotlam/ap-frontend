'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import api, { tokenUtils } from '@/lib/api';

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
    tokenUtils.removeToken();
    // Clear role cookie
    document.cookie = 'role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Starting auth check...');
      
      const response = await api.get('/users/me');
      console.log('🔍 /users/me response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('🔍 User data received:', { id: userData._id, email: userData.email, role: userData.role });
        
        setUser(userData);
        setIsAuthenticated(true);
        // Set role cookie for middleware
        document.cookie = `role=${userData.role}; path=/; max-age=86400; SameSite=Strict`;
        console.log('✅ Auth check successful');
        return true;
      } else if (response.status === 401) {
        console.log('❌ Auth check failed - 401 Unauthorized');
        clearAuthState();
        return false;
      } else {
        console.error('❌ Auth check failed - unexpected status:', response.status);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
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
      // Even if logout API fails, clear local state
      clearAuthState();
      toast.error('Logged out successfully');
      router.push('/auth/login');
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

  // Handle all redirects based on auth state and current path
  useEffect(() => {
    if (!isInitialized || isLoading) return;
    
    const isPublicPath = pathname.startsWith('/auth/');
    const isAdminPath = pathname.startsWith('/admin/');
    
    console.log('🔄 AuthContext redirect check:', {
      isInitialized,
      isLoading,
      isAuthenticated,
      pathname,
      isPublicPath,
      isAdminPath,
      userRole: user?.role
    });

    // If user is authenticated and tries to access auth pages, redirect to home
    if (isAuthenticated && isPublicPath) {
      console.log('🔄 AuthContext: Authenticated user on auth page, redirecting to home');
      router.replace('/');
      return;
    }

    // If no token and trying to access protected route (except public paths)
    if (!isAuthenticated && !isPublicPath) {
      console.log('🔄 AuthContext: Unauthenticated user on protected route, redirecting to login');
      router.replace('/auth/login');
      return;
    }

    // If trying to access admin routes without admin role
    if (isAdminPath && user?.role !== 'admin') {
      console.log('🔄 AuthContext: Non-admin user on admin route, redirecting to home');
      router.replace('/');
      return;
    }

    console.log('✅ AuthContext: Allowing current page');
  }, [isInitialized, isAuthenticated, pathname, user?.role, isLoading, router]);

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