'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CashSession, CashSummary, SessionSummary, User } from '@/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Plus, CheckCircle, XCircle, Filter } from 'lucide-react';

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
    const start = searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');
    const end = searchParams.get('endDate') || format(new Date(), 'yyyy-MM-dd');
    
    setDatePreset(preset);
    setStartDate(start);
    setEndDate(end);
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
      
      const [sRes, sumRes] = await Promise.all([
        api.get(`/cashbox/sessions?startDate=${start}&endDate=${end}`),
        api.get(`/cashbox/summary?startDate=${start}&endDate=${end}`)
      ]);
      
      if (sRes.ok) {
        const data = await sRes.json();
        setSessions(data.sessions || []);
      } else {
        console.error('Sessions API error:', sRes.status, await sRes.text());
      }
      
      if (sumRes.ok) {
        const data = await sumRes.json();
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

  // Load state from URL on mount
  useEffect(() => {
    loadStateFromURL();
  }, [searchParams]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cash Box Management</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage sessions and view cash entries per day</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Date selector */}
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Date Range Selection</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* Date Preset Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Period</label>
                <Select value={datePreset} onValueChange={(value) => {
                  setDatePreset(value);
                  if (value === 'custom') {
                    updateURL(value, startDate, endDate);
                  } else {
                    const { start, end } = getDateRange(value);
                    updateURL(value, start, end);
                  }
                }}>
                  <SelectTrigger className="w-full">
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

              {/* Custom Date Range - Only show when custom is selected */}
              {datePreset === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">From Date</label>
                    <Input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        updateURL(datePreset, e.target.value, endDate);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">To Date</label>
                    <Input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        updateURL(datePreset, startDate, e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Date Range Display */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Selected Period:</div>
                <div className="font-medium text-gray-900">
                  {(() => {
                    const { start, end } = getDateRange(datePreset);
                    if (start === end) {
                      return format(new Date(start), 'EEEE, MMMM do, yyyy');
                    } else {
                      return `${format(new Date(start), 'MMM do, yyyy')} - ${format(new Date(end), 'MMM do, yyyy')}`;
                    }
                  })()}
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-end">
                <Button onClick={fetchData} className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />Apply Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Summary */}
        {!loading && (
          <Card className="mb-6 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {summary ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                    <div className="p-3 sm:p-4 border rounded-lg bg-white">
                      <div className="text-xs sm:text-sm text-gray-600">Total Net</div>
                      <div className={`text-lg sm:text-xl font-semibold ${summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{summary.net.toFixed(2)}</div>
                    </div>
                    <div className="p-3 sm:p-4 border rounded-lg bg-white">
                      <div className="text-xs sm:text-sm text-gray-600">Total Sessions</div>
                      <div className="text-lg sm:text-xl font-semibold text-gray-900">{summary.sessionCount}</div>
                    </div>
                  </div>

                  {/* Session Breakdown by Session Type */}
                  {summary.sessionBreakdown && summary.sessionBreakdown.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Session Breakdown by Type</h4>
                      <div className="space-y-3">
                        {summary.sessionBreakdown.map((sessionGroup) => (
                          <div key={sessionGroup.sessionName} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-medium text-gray-900">{sessionGroup.sessionName}</div>
                                <div className="text-xs text-gray-600">
                                  {sessionGroup.sessionCount} session{sessionGroup.sessionCount !== 1 ? 's' : ''} in range
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-xl font-semibold ${sessionGroup.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₹{sessionGroup.totalNet.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">Total Net</div>
                              </div>
                            </div>
                            
                            {/* Individual sessions for this type */}
                            <div className="space-y-2">
                              {sessionGroup.sessions.map((session) => (
                                <div key={session.sessionId} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-700">
                                      {format(new Date(session.date), 'MMM do, yyyy')} • 
                                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                        session.status === 'open' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {session.status.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Opening: ₹{session.openingAmount.toFixed(2)} • Closing: ₹{session.closingAmount.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-sm font-medium ${session.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      ₹{session.net.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <div className="text-lg font-medium mb-2">No Data Available</div>
                  <div className="text-sm">No sessions found for the selected period.</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sessions */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Sessions</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    const { start, end } = getDateRange(datePreset);
                    if (start === end) {
                      return `For ${format(new Date(start), 'EEEE, MMMM do, yyyy')}`;
                    } else {
                      return `From ${format(new Date(start), 'MMM do')} to ${format(new Date(end), 'MMM do, yyyy')}`;
                    }
                  })()}
                </p>
              </div>
              {(user?.role === 'admin') && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="sm" variant="outline" onClick={() => router.push('/admin/cashbox/settings')} className="w-full sm:w-auto">
                    Manage Session Types
                  </Button>
                  <Button size="sm" onClick={() => {
                    const { start } = getDateRange(datePreset);
                    const params = new URLSearchParams();
                    params.set('date', start);
                    params.set('returnUrl', `/admin/cashbox?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                    router.push(`/admin/cashbox/daily?${params.toString()}`);
                  }} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Create Daily Sessions
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No sessions found for the selected period.
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((s) => (
                  <div key={s._id} className="p-4 sm:p-6 border rounded-lg bg-white hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div className="font-medium text-gray-900">
                        {s.sessionName} Session
                      </div>
                      <div className="text-xs">
                        {s.status === 'open' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">OPEN</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">CLOSED</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {format(new Date(s.openedAt), 'hh:mm a')} 
                      {s.closedAt && ` - ${format(new Date(s.closedAt), 'hh:mm a')}`}
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      Opening: ₹{s.openingAmount.toFixed(2)}
                      {s.closingAmount !== undefined && ` • Closing: ₹${s.closingAmount.toFixed(2)}`}
                    </div>
                    {s.notes && <div className="text-xs text-gray-500 mb-3">{s.notes}</div>}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        const params = new URLSearchParams();
                        params.set('returnUrl', `/admin/cashbox?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                        router.push(`/admin/cashbox/sessions/${s._id}?${params.toString()}`);
                      }} className="w-full sm:w-auto">
                        View Details
                      </Button>
                      {s.status === 'open' && (
                        <Button variant="outline" size="sm" onClick={() => {
                          const params = new URLSearchParams();
                          params.set('returnUrl', `/admin/cashbox?preset=${datePreset}&startDate=${startDate}&endDate=${endDate}`);
                          router.push(`/admin/cashbox/sessions/${s._id}/close?${params.toString()}`);
                        }} className="w-full sm:w-auto">
                          <CheckCircle className="h-4 w-4 mr-1" /> Close Session
                        </Button>
                      )}
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


