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
      if (!isAdmin) {
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
          <p className="text-gray-600 mt-1">Recipe-driven daily task generation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/new-tasks/planner')}>
            <CardHeader>
              <CardTitle className="flex items-center"><Calendar className="h-5 w-5 mr-2 text-blue-600" />Day Planner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Select recipes for the day, set start times, and generate tasks.</p>
              <Button variant="outline" size="sm" className="mt-3">Open Planner <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/new-tasks/recipes')}>
            <CardHeader>
              <CardTitle className="flex items-center"><ChefHat className="h-5 w-5 mr-2 text-emerald-600" />Recipes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Create recipes with steps and per-step task templates.</p>
              <Button variant="outline" size="sm" className="mt-3">Manage Recipes <ArrowRight className="h-4 w-4 ml-2" /></Button>
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
      </div>
    </div>
  );
}


