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
import { CashSession, CashSummary, SessionSummary, User } from '@/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Clock, 
  Settings, 
  Eye,
  BarChart3,
  Wallet,
  Users,
  Activity,
  Edit,
  Trash2
} from 'lucide-react';

export default function CashBoxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isLoading } = useAuth();
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<string>('today');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // URL state management
  const updateURL = (preset: string, start?: string, end?: string) => {
    const params = new URLSearchParams();
    params.set('preset', preset);
    if (start) params.set('startDate', start);
    if (end) params.set('endDate', end);
    router.replace(`/admin/cashbox?${params.toString()}`, { scroll: false });
  };

  const loadStateFromURL = () => {
    const preset = searchParams.get('preset') || 'today';
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
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(datePreset);
      console.log('Fetching data with:', { datePreset, start, end });
      
      const [sRes, sumRes] = await Promise.all([
        api.get(`/cashbox/sessions?startDate=${start}&endDate=${end}`),
        api.get(`/cashbox/summary?startDate=${start}&endDate=${end}`)
      ]);
      
      if (sRes.ok) {
        const data = await sRes.json();
        console.log('Sessions data received:', data);
        setSessions(data.sessions || []);
      } else {
        console.error('Sessions API error:', sRes.status, await sRes.text());
      }
      
      if (sumRes.ok) {
        const data = await sumRes.json();
        console.log('Summary data received:', data);
        setSummary(data.summary || null);
      } else {
        console.error('Summary API error:', sumRes.status, await sumRes.text());
        setSummary(null);
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
      // Admin and employee can access
      fetchData();
    }
  }, [isLoading, user, datePreset, startDate, endDate]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Dashboard Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 lg:gap-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm border">
                <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Cash Management</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">Monitor and manage your cash flow operations</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full sm:w-auto text-sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
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
                    {(user?.role === 'admin') && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => router.push('/admin/cashbox/settings')} 
                          className="text-xs px-2 h-7"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Types
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const { start } = getDateRange(datePreset);
                            const params = new URLSearchParams();
                            params.set('date', start);
                            params.set('returnUrl', `/admin/cashbox?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                            router.push(`/admin/cashbox/daily?${params.toString()}`);
                          }} 
                          className="text-xs px-2 h-7"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create
                        </Button>
                      </>
                    )}
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
                  {(user?.role === 'admin') && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push('/admin/cashbox/settings')} 
                        className="w-full justify-start text-xs h-7"
                      >
                        <Settings className="h-3 w-3 mr-2" />
                        Manage Types
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          const { start } = getDateRange(datePreset);
                          const params = new URLSearchParams();
                          params.set('date', start);
                          params.set('returnUrl', `/admin/cashbox?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                          router.push(`/admin/cashbox/daily?${params.toString()}`);
                        }} 
                        className="w-full justify-start text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Create Sessions
                      </Button>
                    </>
                  )}
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
            {/* Total Net Card */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-emerald-50 cursor-pointer hover:shadow-lg hover:border-green-300 transition-all duration-200"
              onClick={() => {
                console.log('Total Net card clicked');
                const params = new URLSearchParams();
                params.set('startDate', startDate || '');
                params.set('endDate', endDate || '');
                params.set('returnUrl', window.location.pathname + window.location.search);
                const url = `/admin/cashbox/sessions?${params.toString()}`;
                console.log('Navigating to:', url);
                router.push(url);
              }}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">Total Net</p>
                    <p className={`text-lg sm:text-xl lg:text-3xl font-bold ${(summary?.net ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      ₹{(summary?.net ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
                    {(summary?.net ?? 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Sessions Card */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-indigo-50 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
              onClick={() => {
                console.log('Total Sessions card clicked');
                const params = new URLSearchParams();
                params.set('startDate', startDate || '');
                params.set('endDate', endDate || '');
                params.set('returnUrl', window.location.pathname + window.location.search);
                const url = `/admin/cashbox/sessions?${params.toString()}`;
                console.log('Navigating to:', url);
                router.push(url);
              }}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Total Sessions</p>
                    <p className="text-lg sm:text-xl lg:text-3xl font-bold text-blue-700">{summary?.sessionCount || 0}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions Card */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer hover:shadow-lg hover:border-orange-300 transition-all duration-200"
              onClick={() => {
                console.log('Active Sessions card clicked');
                const params = new URLSearchParams();
                params.set('status', 'open');
                params.set('startDate', startDate || '');
                params.set('endDate', endDate || '');
                params.set('returnUrl', window.location.pathname + window.location.search);
                const url = `/admin/cashbox/sessions?${params.toString()}`;
                console.log('Navigating to:', url);
                router.push(url);
              }}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">Active</p>
                    <p className="text-lg sm:text-xl lg:text-3xl font-bold text-orange-700">
                      {sessions.filter(s => s.status === 'open').length}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-full flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Closed Sessions Card */}
            <Card 
              className="shadow-sm border-0 bg-gradient-to-br from-gray-50 to-slate-50 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200"
              onClick={() => {
                console.log('Closed Sessions card clicked');
                const params = new URLSearchParams();
                params.set('status', 'closed');
                params.set('startDate', startDate || '');
                params.set('endDate', endDate || '');
                params.set('returnUrl', window.location.pathname + window.location.search);
                const url = `/admin/cashbox/sessions?${params.toString()}`;
                console.log('Navigating to:', url);
                router.push(url);
              }}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Closed</p>
                    <p className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-700">
                      {sessions.filter(s => s.status === 'closed').length}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-100 rounded-full flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Session Type Banners - Enhanced */}
        {!loading && summary?.sessionBreakdown && summary.sessionBreakdown.length > 0 && (
          <Card className="mb-4 sm:mb-6 lg:mb-8 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-green-600" />
                Session Types Overview
              </CardTitle>
              <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Click on any session type to view detailed breakdown</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {summary.sessionBreakdown.map((sessionGroup) => {
                  // Calculate active and closed sessions for this session type
                  const activeSessions = sessionGroup.sessions.filter(s => s.status === 'open').length;
                  const closedSessions = sessionGroup.sessions.filter(s => s.status === 'closed').length;
                  
                  return (
                    <div 
                      key={sessionGroup.sessionName} 
                      className="group relative bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                      onClick={() => {
                        console.log('Banner clicked for session type:', sessionGroup.sessionName);
                        const params = new URLSearchParams();
                        params.set('sessionType', sessionGroup.sessionName);
                        params.set('startDate', startDate || '');
                        params.set('endDate', endDate || '');
                        params.set('returnUrl', window.location.pathname + window.location.search);
                        const url = `/admin/cashbox/sessions?${params.toString()}`;
                        console.log('Navigating to:', url);
                        router.push(url);
                      }}
                    >
                      <div className="text-center">
                        {/* Session Type Name */}
                        <div className="text-sm sm:text-base font-semibold text-gray-800 mb-3">
                          {sessionGroup.sessionName}
                        </div>
                        
                        {/* Net Amount */}
                        <div className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 ${sessionGroup.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{sessionGroup.totalNet.toFixed(2)}
                        </div>
                        
                        {/* Session Statistics */}
                        <div className="space-y-2 mb-4">
                          <div 
                            className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Total Sessions clicked for:', sessionGroup.sessionName);
                              const params = new URLSearchParams();
                              params.set('sessionType', sessionGroup.sessionName);
                              params.set('startDate', startDate || '');
                              params.set('endDate', endDate || '');
                              params.set('returnUrl', window.location.pathname + window.location.search);
                              const url = `/admin/cashbox/sessions?${params.toString()}`;
                              console.log('Navigating to:', url);
                              router.push(url);
                            }}
                          >
                            <span className="text-gray-600">Total Sessions:</span>
                            <span className="font-medium text-gray-900 hover:text-blue-600">{sessionGroup.sessionCount}</span>
                          </div>
                          <div 
                            className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Active Sessions clicked for:', sessionGroup.sessionName);
                              const params = new URLSearchParams();
                              params.set('sessionType', sessionGroup.sessionName);
                              params.set('status', 'open');
                              params.set('startDate', startDate || '');
                              params.set('endDate', endDate || '');
                              params.set('returnUrl', window.location.pathname + window.location.search);
                              const url = `/admin/cashbox/sessions?${params.toString()}`;
                              console.log('Navigating to:', url);
                              router.push(url);
                            }}
                          >
                            <span className="text-gray-600">Active:</span>
                            <span className="font-medium text-green-600 hover:text-green-700">{activeSessions}</span>
                          </div>
                          <div 
                            className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Closed Sessions clicked for:', sessionGroup.sessionName);
                              const params = new URLSearchParams();
                              params.set('sessionType', sessionGroup.sessionName);
                              params.set('status', 'closed');
                              params.set('startDate', startDate || '');
                              params.set('endDate', endDate || '');
                              params.set('returnUrl', window.location.pathname + window.location.search);
                              const url = `/admin/cashbox/sessions?${params.toString()}`;
                              console.log('Navigating to:', url);
                              router.push(url);
                            }}
                          >
                            <span className="text-gray-600">Closed:</span>
                            <span className="font-medium text-gray-600 hover:text-gray-700">{closedSessions}</span>
                          </div>
                        </div>
                        
                        {/* View Details Button */}
                        <div className="flex items-center justify-center text-xs sm:text-sm text-blue-600 group-hover:text-blue-700 font-medium">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}


