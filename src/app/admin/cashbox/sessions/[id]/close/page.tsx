'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export default function CloseSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { user, isLoading } = useAuth();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast.error('Closing amount is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/cashbox/sessions/${sessionId}/close`, {
        closingAmount: parseFloat(amount),
        notes: notes || undefined,
      });
      if (res.ok) {
        toast.success('Session closed');
        router.push(`/admin/cashbox/sessions/${sessionId}`);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to close session');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Session
          </Button>
        </div>

        {/* Close Session Form */}
        <Card className="shadow-lg">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-xl font-semibold text-gray-900">Close Session</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Enter the closing amount and any notes for this session</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700">Closing Amount (₹) *</Label>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full text-lg"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700">Notes (optional)</Label>
                <Input 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Add any notes about closing this session..." 
                  className="w-full"
                />
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()} 
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full sm:w-auto px-8"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? 'Closing...' : 'Close Session'}
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


