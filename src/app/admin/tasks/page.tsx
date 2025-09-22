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
import { Task, TaskStats, User } from '@/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  ArrowLeft, 
  Plus, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Settings, 
  Eye,
  BarChart3,
  Users,
  Activity,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Pause,
  XCircle,
  Play,
  ClipboardList,
  Timer,
  User as UserIcon
} from 'lucide-react';

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
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
    router.replace(`/admin/tasks?${params.toString()}`, { scroll: false });
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
      
      const [tRes, sRes, uRes] = await Promise.all([
        api.get(`/tasks?startDate=${start}&endDate=${end}&limit=10`),
        api.get(`/tasks/stats?startDate=${start}&endDate=${end}`),
        api.get('/users')
      ]);
      
      if (tRes.ok) {
        const data = await tRes.json();
        console.log('Tasks data received:', data);
        setTasks(data.tasks || []);
      } else {
        console.error('Tasks API error:', tRes.status, await tRes.text());
      }
      
      if (sRes.ok) {
        const data = await sRes.json();
        console.log('Stats data received:', data);
        setStats(data);
      } else {
        console.error('Stats API error:', sRes.status, await sRes.text());
        setStats(null);
      }

      if (uRes.ok) {
        const data = await uRes.json();
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

  const handleViewTask = (taskId: string) => {
    const params = new URLSearchParams();
    params.set('returnUrl', `/admin/tasks?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
    router.push(`/admin/tasks/${taskId}?${params.toString()}`);
  };

  const handleEditTask = (taskId: string) => {
    const params = new URLSearchParams();
    params.set('returnUrl', `/admin/tasks?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
    router.push(`/admin/tasks/${taskId}/edit?${params.toString()}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await api.delete(`/tasks/${taskId}`);
        if (response.ok) {
          fetchData(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'on_hold': return <Pause className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Dashboard Header */}
        <div className="mb-5 sm:mb-7 lg:mb-9">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-5">
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
              <div className="leading-tight">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                  Task Management
                </h1>
                <p className="text-sm sm:text-[15px] text-gray-600 mt-1.5">
                  Manage and track hotel tasks and assignments
                </p>
              </div>
            </div>
            {/* Redundant header actions removed; use Quick Actions below */}
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
                      onClick={() => router.push('/admin/tasks/templates')} 
                      className="text-xs px-2 h-7"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Templates
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set('returnUrl', `/admin/tasks?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                        router.push(`/admin/tasks/create?${params.toString()}`);
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
                    onClick={() => router.push('/admin/tasks/templates')} 
                    className="w-full justify-start text-xs h-7"
                  >
                    <Settings className="h-3 w-3 mr-2" />
                    Manage Templates
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('returnUrl', `/admin/tasks?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                      router.push(`/admin/tasks/create?${params.toString()}`);
                    }} 
                    className="w-full justify-start text-xs h-7"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Add Task
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
        {!loading && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Total Tasks */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/tasks/list?startDate=${startDate}&endDate=${endDate}`)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Total Tasks</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {stats.overview?.total ?? 0}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                    <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/tasks/list?startDate=${startDate}&endDate=${endDate}&status=completed`)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">Completed</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {stats.overview?.completed ?? 0}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* In Progress Tasks */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/tasks/list?startDate=${startDate}&endDate=${endDate}&status=in_progress`)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">In Progress</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {stats.overview?.inProgress ?? 0}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/tasks/list?startDate=${startDate}&endDate=${endDate}&status=pending`)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-purple-600 mb-1">Pending</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {stats.overview?.pending ?? 0}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Task Generation Section */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm mb-4 sm:mb-6 lg:mb-8">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-indigo-600" />
              Generate Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/admin/tasks/generate?type=daily&startDate=${startDate}&endDate=${endDate}`)}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Generate Daily Tasks</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/admin/tasks/generate?type=weekly&startDate=${startDate}&endDate=${endDate}`)}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Generate Weekly Tasks</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/admin/tasks/generate?type=monthly&startDate=${startDate}&endDate=${endDate}`)}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Generate Monthly Tasks</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
                Recent Tasks
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/admin/tasks/list?startDate=${startDate}&endDate=${endDate}`)}
                className="text-xs"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No tasks found for the selected period</div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {tasks.map((task) => (
                  <div key={task._id} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          <span className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {task.title}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">
                          {task.taskFor} • {format(new Date(task.dueDate || task.createdAt), 'MMM do, yyyy')}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          Assigned to: {(() => {
                            const owner = (task as any).taskOwner;
                            const ownerId = typeof owner === 'string' ? owner : owner?._id;
                            const user = users.find(u => u._id === ownerId);
                            return user ? user.firstName : (typeof owner === 'string' ? owner : owner?.firstName || '');
                          })()}
                          {task.estimatedDuration && (
                            <span className="ml-2">
                              • Est: {task.estimatedDuration}min
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <div className="text-xs sm:text-sm text-gray-700 mt-1 truncate">
                            {task.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTask(task._id)}
                          className="text-xs h-7 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTask(task._id)}
                          className="text-xs h-7 px-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTask(task._id)}
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