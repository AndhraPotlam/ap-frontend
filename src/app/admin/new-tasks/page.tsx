'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Calendar, ArrowRight, ChefHat, ClipboardList, Settings } from 'lucide-react';

export default function NewTasksDashboard() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      // Check if user is admin or employee
      const isAdminOrEmployee = isAdmin || user?.role === 'employee';
      if (!isAdminOrEmployee) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isLoading, user, isAdmin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">New Task Management</h1>
          <p className="text-gray-600 mt-1">Recipe process-driven daily task generation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/new-tasks/planner')}>
            <CardHeader>
              <CardTitle className="flex items-center"><Calendar className="h-5 w-5 mr-2 text-blue-600" />Day Planner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Select recipe processes for the day, set start times, and generate tasks.</p>
              <Button variant="outline" size="sm" className="mt-3">Open Planner <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/new-tasks/tasks')}>
            <CardHeader>
              <CardTitle className="flex items-center"><ClipboardList className="h-5 w-5 mr-2 text-purple-600" />Generated Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">View tasks by timeline, list, step, or assignee.</p>
              <Button variant="outline" size="sm" className="mt-3">View Tasks <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </CardContent>
          </Card>
        </div>

        {/* Note about Recipe Processes */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ChefHat className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Recipe Process Management</h3>
                <p className="text-sm text-blue-700">
                  Recipe processes have been moved to <strong>Product Management</strong> for better organization. 
                  <Button variant="link" className="p-0 h-auto text-blue-600 underline" onClick={() => router.push('/admin/products')}>
                    Go to Product Management
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


