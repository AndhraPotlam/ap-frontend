'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CashSession } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft, Trash2, Edit, Save, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SessionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const returnUrl = searchParams.get('returnUrl') || '/admin/cashbox';
  const { user, isLoading } = useAuth();
  const [session, setSession] = useState<CashSession | null>(null);
  const [summary, setSummary] = useState<{ net: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingOpening, setEditingOpening] = useState(false);
  const [editingClosing, setEditingClosing] = useState(false);
  const [editOpeningAmount, setEditOpeningAmount] = useState('');
  const [editClosingAmount, setEditClosingAmount] = useState('');
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const isAdminOrEmployee = user && (user.role === 'admin' || user.role === 'employee');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cashbox/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setSummary(data.summary || null);
      } else {
        toast.error('Failed to load session');
        router.push('/admin/cashbox');
      }
    } catch {
      toast.error('Failed to load session');
      router.push('/admin/cashbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      fetchDetails();
    }
  }, [isLoading, user, sessionId]);


  const handleDeleteSession = async () => {
    try {
      const res = await api.delete(`/cashbox/sessions/${sessionId}`);
           if (res.ok) {
             toast.success('Session deleted successfully');
             router.push(returnUrl);
           } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to delete session');
      }
    } catch {
      toast.error('Failed to delete session');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const startEditOpening = () => {
    setEditOpeningAmount(session?.openingAmount?.toString() || '0');
    setEditingOpening(true);
  };

  const startEditClosing = () => {
    setEditClosingAmount(session?.closingAmount?.toString() || '0');
    setEditingClosing(true);
  };

  const cancelEditOpening = () => {
    setEditingOpening(false);
    setEditOpeningAmount('');
  };

  const cancelEditClosing = () => {
    setEditingClosing(false);
    setEditClosingAmount('');
  };

  const handleUpdateOpeningAmount = async () => {
    if (!editOpeningAmount || parseFloat(editOpeningAmount) < 0) {
      toast.error('Please enter a valid opening amount (≥ 0)');
      return;
    }

    setIsUpdatingSession(true);
    try {
      const res = await api.put(`/cashbox/sessions/${sessionId}`, {
        openingAmount: parseFloat(editOpeningAmount)
      });
      if (res.ok) {
        toast.success('Opening amount updated');
        setEditingOpening(false);
        fetchDetails();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to update opening amount');
      }
    } catch {
      toast.error('Failed to update opening amount');
    } finally {
      setIsUpdatingSession(false);
    }
  };

  const handleUpdateClosingAmount = async () => {
    if (!editClosingAmount || parseFloat(editClosingAmount) < 0) {
      toast.error('Please enter a valid closing amount (≥ 0)');
      return;
    }

    setIsUpdatingSession(true);
    try {
      const res = await api.put(`/cashbox/sessions/${sessionId}`, {
        closingAmount: parseFloat(editClosingAmount)
      });
      if (res.ok) {
        toast.success('Closing amount updated');
        setEditingClosing(false);
        fetchDetails();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to update closing amount');
      }
    } catch {
      toast.error('Failed to update closing amount');
    } finally {
      setIsUpdatingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Loading session...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <Button variant="outline" onClick={() => router.push(returnUrl)} className="w-full sm:w-auto">
                   <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cash Box
                 </Button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="text-sm text-gray-600">
                Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  session.status === 'open' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {session.status.toUpperCase()}
                </span>
              </div>
              {user?.role === 'admin' && (
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)} className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Session
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Session Details */}
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Opened</div>
                <div className="font-medium text-gray-900">{format(new Date(session.openedAt), 'PPpp')}</div>
                <div className="text-sm text-gray-600 mt-1">By: {typeof session.openedBy === 'string' ? session.openedBy : `${session.openedBy.firstName} ${session.openedBy.lastName}`}</div>
                <div className="text-sm text-gray-700 mt-1 flex items-center justify-between">
                  <span>Opening: ₹{session.openingAmount.toFixed(2)}</span>
                  {isAdminOrEmployee && (
                    <Button variant="outline" size="sm" onClick={startEditOpening} className="ml-2">
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingOpening && (
                  <div className="mt-2 space-y-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editOpeningAmount}
                      onChange={(e) => setEditOpeningAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-sm"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleUpdateOpeningAmount} disabled={isUpdatingSession} className="text-xs">
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEditOpening} className="text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Closed</div>
                <div className="font-medium text-gray-900">{session.closedAt ? format(new Date(session.closedAt), 'PPpp') : '-'}</div>
                <div className="text-sm text-gray-600 mt-1">By: {session.closedBy ? (typeof session.closedBy === 'string' ? session.closedBy : `${session.closedBy.firstName} ${session.closedBy.lastName}`) : '-'}</div>
                <div className="text-sm text-gray-700 mt-1 flex items-center justify-between">
                  <span>Closing: {session.closingAmount !== undefined ? `₹${session.closingAmount.toFixed(2)}` : '-'}</span>
                  {isAdminOrEmployee && session.status === 'closed' && (
                    <Button variant="outline" size="sm" onClick={startEditClosing} className="ml-2">
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingClosing && (
                  <div className="mt-2 space-y-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editClosingAmount}
                      onChange={(e) => setEditClosingAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-sm"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleUpdateClosingAmount} disabled={isUpdatingSession} className="text-xs">
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEditClosing} className="text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg sm:col-span-2 lg:col-span-1">
                <div className="text-xs text-gray-600 mb-1">Net</div>
                <div className={`text-xl font-semibold ${summary && summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{summary ? summary.net.toFixed(2) : '0.00'}</div>
                <div className="text-sm text-gray-600 mt-1">Closing - Opening</div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Delete Session Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Session</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this entire session? This will permanently remove the session and all its entries. This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="w-full sm:flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteSession} className="w-full sm:flex-1">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Session
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


