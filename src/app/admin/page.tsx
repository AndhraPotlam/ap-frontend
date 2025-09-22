'use client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Tags,
  ArrowRight,
  Coins,
  ClipboardList
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {/* Categories Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Categories</div>
            <p className="text-xs text-muted-foreground mt-1">
              Add, edit, or remove product categories
            </p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/admin/categories')}
            >
              View Categories
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Cash Box Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Box Management</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Cash Sessions</div>
            <p className="text-xs text-muted-foreground mt-1">
              Open/close sessions, record cash in/out, and view summaries
            </p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/admin/cashbox')}
            >
              Manage Cash Box
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage Products</div>
            <p className="text-xs text-muted-foreground mt-1">
              Add, edit, or remove products
            </p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/admin/products')}
            >
              View Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage Orders</div>
            <p className="text-xs text-muted-foreground mt-1">
              View and manage customer orders
            </p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/admin/orders')}
            >
              View Orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage Users</div>
            <p className="text-xs text-muted-foreground mt-1">
              View and manage user accounts
            </p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/admin/users')}
            >
              View Users
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* New Task Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Task Management</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Recipe Tasks</div>
            <p className="text-xs text-muted-foreground mt-1">
              Plan by recipes and generate daily tasks
            </p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/admin/new-tasks')}
            >
              Open New Task Management
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 