'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, User, ShoppingCart, Heart, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check auth state only once on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const auth = await checkAuth();
        console.log("auth:", auth);
        if (auth) {
          console.log("redirecting to home from login page");
          router.replace('/');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthState();
  }, []); // Empty dependency array means this runs once on mount

  // Don't render the form while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError('');
      
      // Validate form data
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
      
      const response = await api.post('/users/login', formData);
      
      if (response.ok) {
        console.log('✅ Login successful, checking auth...');
        
        // Wait a bit for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const isAuthenticated = await checkAuth();
        console.log('🔍 Auth check result:', isAuthenticated);
        
        if (isAuthenticated) {
          toast.success('Login successful!');
          console.log('🚀 Redirecting to home...');
          
          // Try immediate redirect
          router.replace('/');
          
          // Fallback redirect after a short delay
          setTimeout(() => {
            if (window.location.pathname === '/auth/login') {
              console.log('🔄 Fallback redirect to home...');
              router.replace('/');
            }
          }, 1000);
        } else {
          console.error('❌ Auth check failed after login');
          setError('Failed to authenticate after login. Please try again.');
          toast.error('Authentication failed. Please try again.');
        }
      } else {
        // Handle error response
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Login failed. Please check your credentials and try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual content */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-secondary/10 items-center justify-center p-12">
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Welcome Back!</h1>
            <p className="text-lg text-muted-foreground">
              Sign in to your account to access your favorite Andhra products and manage your orders.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Personal Account</h3>
                <p className="text-sm text-muted-foreground">Access your personalized dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Order History</h3>
                <p className="text-sm text-muted-foreground">Track and manage your orders</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Saved Items</h3>
                <p className="text-sm text-muted-foreground">Access your wishlist and favorites</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button variant="link" asChild>
              <Link href="/auth/forgot-password" prefetch={false}>Forgot password?</Link>
            </Button>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Don't have an account?</p>
              <Button variant="outline" asChild>
                <Link href="/auth/register" prefetch={false}>Create account</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}