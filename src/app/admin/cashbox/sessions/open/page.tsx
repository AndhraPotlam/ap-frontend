'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export default function OpenSessionPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
    }
  }, [isLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast.error('Opening amount is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/cashbox/sessions`, {
        openingAmount: parseFloat(amount),
        notes: notes || undefined,
        date,
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Session opened');
        router.push(`/admin/cashbox/sessions/${data.session._id}`);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to open session');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Open New Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-2 block">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Opening Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="mb-2 block">Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="submit" disabled={submitting}><Save className="h-4 w-4 mr-2" />{submitting ? 'Opening...' : 'Open Session'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


