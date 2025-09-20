'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CashSessionType, CashSession } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SessionData {
  sessionTypeId: string;
  sessionName: string;
  openingAmount: number;
  notes?: string;
}

export default function DailyCashEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const returnUrl = searchParams.get('returnUrl') || '/admin/cashbox';
  const { user, isLoading } = useAuth();
  const [sessionTypes, setSessionTypes] = useState<CashSessionType[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [existingSessions, setExistingSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      fetchData();
    }
  }, [isLoading, user, date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionTypesRes, sessionsRes] = await Promise.all([
        api.get('/cashbox/session-types?isActive=true'),
        api.get(`/cashbox/sessions?startDate=${date}&endDate=${date}`)
      ]);

      if (sessionTypesRes.ok) {
        const data = await sessionTypesRes.json();
        setSessionTypes(data.types || []);
        
        // Initialize sessions with active session types
        if (data.types && data.types.length > 0) {
          setSessions(data.types.map((type: CashSessionType) => ({
            sessionTypeId: type._id,
            sessionName: type.name,
            openingAmount: 0,
            notes: ''
          })));
        }
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setExistingSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateSession = (index: number, field: keyof SessionData, value: any) => {
    setSessions(prev => prev.map((session, i) => 
      i === index ? { ...session, [field]: value } : session
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate sessions
    const invalidSessions = sessions.filter(s => 
      s.openingAmount === undefined || 
      s.openingAmount === null || 
      isNaN(s.openingAmount) || 
      s.openingAmount < 0
    );

    if (invalidSessions.length > 0) {
      toast.error('All sessions must have a valid opening amount (0 or greater)');
      return;
    }

    // Check for empty session types
    const emptySessionTypes = sessions.filter(s => !s.sessionTypeId);
    if (emptySessionTypes.length > 0) {
      toast.error('All sessions must have a valid session type');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/cashbox/daily-sessions', {
        date,
        sessions: sessions.map(s => ({
          sessionTypeId: s.sessionTypeId,
          openingAmount: Number(s.openingAmount), // Ensure it's a number
          notes: s.notes || undefined
        }))
      });

      if (response.ok) {
        toast.success('Daily sessions created successfully');
        router.push(returnUrl);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create sessions');
      }
    } catch (error) {
      console.error('Error creating sessions:', error);
      toast.error('Failed to create sessions');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Loading...</div>
        </div>
      </div>
    );
  }

  if (!sessionTypes || sessionTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900">No Session Types Configured</h2>
            <p className="text-gray-600 mb-6">Please create session types in Cash Box Settings first.</p>
            <Button onClick={() => router.push('/admin/cashbox/settings')} className="w-full sm:w-auto">
              Go to Session Types
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (existingSessions.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900">Sessions Already Exist</h2>
            <p className="text-gray-600 mb-6">Cash sessions for {format(new Date(date), 'PPP')} have already been created.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push(returnUrl)} className="w-full sm:w-auto">
                View Sessions
              </Button>
              <Button variant="outline" onClick={() => router.push(returnUrl)} className="w-full sm:w-auto">
                Back to Cash Box
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Daily Cash Sessions</h1>
              <p className="text-base sm:text-lg text-gray-600 mt-2">Date: {format(new Date(date), 'PPP')}</p>
            </div>
            <Button variant="outline" onClick={() => router.push(returnUrl)} className="w-full sm:w-auto flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Cash Box
            </Button>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-xl font-semibold text-gray-900">Configure Sessions</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Set opening amounts for each session type (0 is allowed for no opening cash)</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {sessions.map((session, index) => (
                <div key={index} className="bg-gray-50 p-4 sm:p-6 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{session.sessionName} Session</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor={`opening-${index}`} className="text-sm font-medium text-gray-700">
                        Opening Amount (₹) *
                      </Label>
                      <Input
                        id={`opening-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={session.openingAmount ?? 0}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            updateSession(index, 'openingAmount', 0);
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              updateSession(index, 'openingAmount', numValue);
                            }
                          }
                        }}
                        placeholder="0.00 (can be 0)"
                        required
                        className="text-base sm:text-lg font-medium w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter 0 if no opening cash amount
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`notes-${index}`} className="text-sm font-medium text-gray-700">
                        Notes (optional)
                      </Label>
                      <Input
                        id={`notes-${index}`}
                        value={session.notes || ''}
                        onChange={(e) => updateSession(index, 'notes', e.target.value)}
                        placeholder="Add any notes for this session..."
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Submit Section */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    {sessions.length} session{sessions.length !== 1 ? 's' : ''} will be created
                  </div>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3 text-base sm:text-lg font-medium"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {submitting ? 'Creating Sessions...' : 'Create Daily Sessions'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
