'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  ShoppingBag, 
  Settings, 
  Package, 
  Tag, 
  Percent, 
  ShoppingCart,
  Home,
  ClipboardList,
  Wallet
} from 'lucide-react';
import { Coins } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.email}! Manage your account and orders from here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Home Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Home className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">Home</CardTitle>
                <CardDescription>Back to main page</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Return to the main page to browse products and shop.
              </p>
            </CardContent>
          </Card>

          {/* User Options */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/profile')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Update your profile details, change password, and manage account settings.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/orders')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <ShoppingBag className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">My Orders</CardTitle>
                <CardDescription>View and manage your orders</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track your orders, view order history, and manage pending orders.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/cart')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <ShoppingCart className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">Shopping Cart</CardTitle>
                <CardDescription>Review your cart items</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View cart items, apply coupons, and proceed to checkout.
              </p>
            </CardContent>
          </Card>

          {/* Admin Options */}
          {isAdmin && (
            <>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/admin/cashbox')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Coins className="h-8 w-8 text-amber-600" />
                  <div className="ml-4">
                    <CardTitle className="text-lg">Cash Box Management</CardTitle>
                    <CardDescription>Manage daily cash sessions and entries</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Configure session types, create daily sessions, record cash in/out, and view summaries.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/admin/products')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Package className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <CardTitle className="text-lg">Products</CardTitle>
                    <CardDescription>Manage product catalog</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Add, edit, and manage products in your catalog.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/admin/categories')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Tag className="h-8 w-8 text-pink-600" />
                  <div className="ml-4">
                    <CardTitle className="text-lg">Categories</CardTitle>
                    <CardDescription>Organize product categories</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Create and manage product categories and subcategories.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/admin/settings')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Settings className="h-8 w-8 text-gray-600" />
                  <div className="ml-4">
                    <CardTitle className="text-lg">Settings</CardTitle>
                    <CardDescription>System configuration</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Configure pricing, tax rates, shipping costs, and system settings.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/admin/coupons')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Percent className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <CardTitle className="text-lg">Coupons</CardTitle>
                    <CardDescription>Manage promotional codes</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Create and manage coupon codes for customer discounts.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/admin/discounts')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Percent className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <CardTitle className="text-lg">Discounts</CardTitle>
                    <CardDescription>Automatic discount rules</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Set up automatic discount rules based on order value, quantity, etc.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/admin/expenses')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Wallet className="h-8 w-8 text-emerald-600" />
                  <div className="ml-4">
                    <CardTitle className="text-lg">Expense Management</CardTitle>
                    <CardDescription>Track expenses and expense categories</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Record daily expenses (cash/online), filter by date, and manage expense categories.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation('/admin/tasks')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <ClipboardList className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <CardTitle className="text-lg">Task Management</CardTitle>
                    <CardDescription>Hotel task management system</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Create, assign, and track daily, weekly, and monthly tasks for hotel operations.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
