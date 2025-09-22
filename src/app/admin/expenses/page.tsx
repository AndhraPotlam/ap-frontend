'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Expense, ExpenseSummary, ExpenseCategory, User } from '@/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  ArrowLeft, 
  Plus, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Settings, 
  Eye,
  BarChart3,
  Wallet,
  Users,
  Activity,
  Edit,
  Trash2,
  Receipt,
  CreditCard,
  Banknote
} from 'lucide-react';

export default function ExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<string>('thisWeek');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // URL state management
  const updateURL = (preset: string, start?: string, end?: string) => {
    const params = new URLSearchParams();
    params.set('preset', preset);
    if (start) params.set('startDate', start);
    if (end) params.set('endDate', end);
    router.replace(`/admin/expenses?${params.toString()}`, { scroll: false });
  };

  const loadStateFromURL = () => {
    const preset = searchParams.get('preset') || 'thisWeek';
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');
    
    console.log('Loading state from URL:', { preset, start, end, allParams: searchParams.toString() });
    
    // If no dates in URL, use preset to calculate them
    if (!start || !end) {
      const { start: calculatedStart, end: calculatedEnd } = getDateRange(preset);
      console.log('Calculated dates from preset:', { calculatedStart, calculatedEnd });
      setStartDate(calculatedStart);
      setEndDate(calculatedEnd);
    } else {
      console.log('Using dates from URL:', { start, end });
      setStartDate(start);
      setEndDate(end);
    }
    
    setDatePreset(preset);
  };

  // Date preset logic
  const getDateRange = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'today':
        return {
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      case 'thisWeek':
        return {
          start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'), // Monday
          end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd') // Sunday
        };
      case 'thisMonth':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        };
      case 'custom':
        return {
          start: startDate,
          end: endDate
        };
      default:
        return {
          start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(datePreset);
      console.log('Fetching data with:', { datePreset, start, end });
      
      const [eRes, sumRes, catRes, userRes] = await Promise.all([
        api.get(`/expenses?startDate=${start}&endDate=${end}&limit=10`),
        api.get(`/expenses/summary?startDate=${start}&endDate=${end}`),
        api.get('/expense-categories'),
        api.get('/users')
      ]);
      
      if (eRes.ok) {
        const data = await eRes.json();
        console.log('Expenses data received:', data);
        setExpenses(data.expenses || []);
      } else {
        console.error('Expenses API error:', eRes.status, await eRes.text());
      }
      
      if (sumRes.ok) {
        const data = await sumRes.json();
        console.log('Summary data received:', data);
        setSummary(data.summary || null);
      } else {
        console.error('Summary API error:', sumRes.status, await sumRes.text());
        setSummary(null);
      }

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.categories || []);
      }

      if (userRes.ok) {
        const data = await userRes.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load state from URL on mount and when URL changes
  useEffect(() => {
    loadStateFromURL();
  }, [searchParams]);

  // Fetch data when dependencies change
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
      fetchData();
    }
  }, [isLoading, user, isAdmin, datePreset, startDate, endDate]);

  // Additional effect to handle page visibility changes and focus (when returning from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoading && user) {
        // Page became visible again, refresh data
        fetchData();
      }
    };

    const handleFocus = () => {
      if (!isLoading && user) {
        // Page gained focus, refresh data
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isLoading, user, datePreset, startDate, endDate]);

  const handleViewExpense = (expenseId: string) => {
    const params = new URLSearchParams();
    params.set('returnUrl', `/admin/expenses?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
    router.push(`/admin/expenses/${expenseId}?${params.toString()}`);
  };

  const handleEditExpense = (expenseId: string) => {
    const params = new URLSearchParams();
    params.set('returnUrl', `/admin/expenses?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
    router.push(`/admin/expenses/${expenseId}/edit?${params.toString()}`);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await api.delete(`/expenses/${expenseId}`);
        if (response.ok) {
          fetchData(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'online': return <CreditCard className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'online': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Dashboard Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Expense Management
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Track and manage business expenses
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                size="sm"
                onClick={() => router.push('/admin/expenses/categories')}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Manage Categories</span>
                <span className="sm:hidden">Categories</span>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('returnUrl', `/admin/expenses?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                  router.push(`/admin/expenses/new?${params.toString()}`);
                }}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Controls Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          {/* Mobile: Stacked layout */}
          <div className="lg:hidden space-y-3">
            {/* Quick Actions - Mobile */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Quick Actions</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => router.push('/admin/expenses/categories')} 
                      className="text-xs px-2 h-7"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Categories
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set('returnUrl', `/admin/expenses?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                        router.push(`/admin/expenses/new?${params.toString()}`);
                      }} 
                      className="text-xs px-2 h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={fetchData} 
                      className="text-xs px-2 h-7"
                    >
                      <Filter className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Range - Mobile */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center mb-3">
                  <Calendar className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Date Range</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block text-gray-700">Select Period</label>
                    <Select value={datePreset} onValueChange={(value) => {
                      setDatePreset(value);
                      if (value === 'custom') {
                        updateURL(value, startDate, endDate);
                      } else {
                        const { start, end } = getDateRange(value);
                        updateURL(value, start, end);
                      }
                    }}>
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border border-blue-100">
                    <div className="text-xs text-blue-600 mb-1 font-medium">Selected Period</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {(() => {
                        const { start, end } = getDateRange(datePreset);
                        if (start === end) {
                          return format(new Date(start), 'MMM do, yyyy');
                        } else {
                          return `${format(new Date(start), 'MMM do')} - ${format(new Date(end), 'MMM do, yyyy')}`;
                        }
                      })()}
                    </div>
                  </div>

                  {datePreset === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium mb-1 block text-gray-700">From</label>
                        <Input 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            updateURL(datePreset, e.target.value, endDate);
                          }}
                          className="w-full h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block text-gray-700">To</label>
                        <Input 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            updateURL(datePreset, startDate, e.target.value);
                          }}
                          className="w-full h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop: Side by side layout */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4">
            {/* Quick Actions - Desktop */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-blue-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => router.push('/admin/expenses/categories')} 
                    className="w-full justify-start text-xs h-7"
                  >
                    <Settings className="h-3 w-3 mr-2" />
                    Manage Categories
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('returnUrl', `/admin/expenses?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                      router.push(`/admin/expenses/new?${params.toString()}`);
                    }} 
                    className="w-full justify-start text-xs h-7"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Add Expense
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={fetchData} 
                    className="w-full justify-start text-xs h-7"
                  >
                    <Filter className="h-3 w-3 mr-2" />
                    Refresh Data
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Date Range - Desktop */}
            <div className="lg:col-span-3">
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-green-600" />
                    Date Range
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium mb-1 block text-gray-700">Select Period</label>
                      <Select value={datePreset} onValueChange={(value) => {
                        setDatePreset(value);
                        if (value === 'custom') {
                          updateURL(value, startDate, endDate);
                        } else {
                          const { start, end } = getDateRange(value);
                          updateURL(value, start, end);
                        }
                      }}>
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="thisWeek">This Week</SelectItem>
                          <SelectItem value="thisMonth">This Month</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border border-blue-100">
                      <div className="text-xs text-blue-600 mb-1 font-medium">Selected Period</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {(() => {
                          const { start, end } = getDateRange(datePreset);
                          if (start === end) {
                            return format(new Date(start), 'MMM do, yyyy');
                          } else {
                            return `${format(new Date(start), 'MMM do')} - ${format(new Date(end), 'MMM do, yyyy')}`;
                          }
                        })()}
                      </div>
                    </div>
                  </div>

                  {datePreset === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium mb-1 block text-gray-700">From Date</label>
                        <Input 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            updateURL(datePreset, e.target.value, endDate);
                          }}
                          className="w-full h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block text-gray-700">To Date</label>
                        <Input 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            updateURL(datePreset, startDate, e.target.value);
                          }}
                          className="w-full h-8"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Dashboard Metrics - Mobile Optimized */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Total Amount */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/expenses/list?startDate=${startDate}&endDate=${endDate}`)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">Total Amount</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      ₹{(summary?.totalAmount ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/expenses/list?startDate=${startDate}&endDate=${endDate}`)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Total Expenses</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {summary?.expenseCount ?? 0}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Expenses */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/expenses/list?startDate=${startDate}&endDate=${endDate}&paymentType=cash`)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">Cash Expenses</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      ₹{summary?.paymentTypeBreakdown.find(p => p.type === 'cash')?.amount.toFixed(2) ?? '0.00'}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
                    <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online Expenses */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/expenses/list?startDate=${startDate}&endDate=${endDate}&paymentType=online`)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-purple-600 mb-1">Online Expenses</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      ₹{summary?.paymentTypeBreakdown.find(p => p.type === 'online')?.amount.toFixed(2) ?? '0.00'}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expense Breakdown - Mobile Optimized */}
        {!loading && summary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Category Breakdown */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-indigo-600" />
                  By Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {summary.categoryBreakdown.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {item.category}
                      </p>
                      <p className="text-xs text-gray-500">{item.percentage}%</p>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 ml-2">
                      ₹{item.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
                {summary.categoryBreakdown.length > 5 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => router.push(`/admin/expenses/list?startDate=${startDate}&endDate=${endDate}`)}
                  >
                    View All Categories
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Type Breakdown */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                  By Payment Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {summary.paymentTypeBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getPaymentTypeIcon(item.type)}
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 capitalize">
                          {item.type}
                        </p>
                        <p className="text-xs text-gray-500">{item.percentage}%</p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      ₹{item.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* User Breakdown */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                  By User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {summary.userBreakdown.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {item.user}
                      </p>
                      <p className="text-xs text-gray-500">{item.percentage}%</p>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 ml-2">
                      ₹{item.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
                {summary.userBreakdown.length > 5 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => router.push(`/admin/expenses/list?startDate=${startDate}&endDate=${endDate}`)}
                  >
                    View All Users
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Expenses */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
                Recent Expenses
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/admin/expenses/list?startDate=${startDate}&endDate=${endDate}`)}
                className="text-xs"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No expenses found for the selected period</div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {expenses.map((expense) => (
                  <div key={expense._id} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={`text-xs ${getPaymentTypeColor(expense.paymentType)}`}>
                            {getPaymentTypeIcon(expense.paymentType)}
                            <span className="ml-1 capitalize">{expense.paymentType}</span>
                          </Badge>
                          <span className="text-sm sm:text-base font-semibold text-gray-900">
                            ₹{expense.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">
                          {typeof expense.category === 'string' 
                            ? categories.find(c => c._id === expense.category)?.name 
                            : expense.category?.name} • {format(new Date(expense.date), 'MMM do, yyyy')}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          Paid by: {typeof expense.paidBy === 'string' 
                            ? users.find(u => u._id === expense.paidBy)?.firstName 
                            : expense.paidBy?.firstName}
                        </div>
                        {expense.description && (
                          <div className="text-xs sm:text-sm text-gray-700 mt-1 truncate">
                            {expense.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewExpense(expense._id)}
                          className="text-xs h-7 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditExpense(expense._id)}
                          className="text-xs h-7 px-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="text-xs h-7 px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}