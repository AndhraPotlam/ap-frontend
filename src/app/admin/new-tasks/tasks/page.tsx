'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Task } from '@/types';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Calendar, List, Rows3, Eye } from 'lucide-react';

type ViewMode = 'list' | 'timeline';

export default function GeneratedTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isLoading } = useAuth();
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>('list');

  useEffect(() => {
    if (!isLoading) {
      if (!user) { router.push('/auth/login'); return; }
      if (!isAdmin) { router.push('/dashboard'); return; }
      fetchTasks();
    }
  }, [isLoading, user, isAdmin, date]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks?startDate=${date}&endDate=${date}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const timelineRows = useMemo(() => {
    // group by location (row), map tasks with start minute and duration
    const byLocation: Record<string, Task[]> = {} as any;
    tasks.forEach(t => {
      const loc = (t as any).location || 'Kitchen';
      if (!byLocation[loc]) byLocation[loc] = [];
      byLocation[loc].push(t);
    });
    return byLocation;
  }, [tasks]);

  const getStartMinutes = (d?: string) => {
    if (!d) return 0;
    const dt = new Date(d);
    return dt.getHours() * 60 + dt.getMinutes();
  };

  const getDuration = (t: Task) => {
    const est = (t as any).estimatedDuration as number | undefined;
    if (est && est > 0) return est;
    const start = getStartMinutes(t.dueDate as any);
    const end = getStartMinutes(((t as any).plannedEnd) as any);
    return Math.max(5, end - start);
  };

  const colorForType = (type?: string) => {
    switch ((type || '').toLowerCase()) {
      case 'cooking': return '#ef4444'; // red
      case 'cutting': return '#10b981'; // emerald
      case 'preparing': return '#6366f1'; // indigo
      case 'cleaning': return '#22c55e'; // green
      case 'mixing': return '#f59e0b'; // amber
      case 'removing': return '#14b8a6'; // teal
      case 'soaking': return '#3b82f6'; // blue
      default: return '#64748b'; // slate
    }
  };

  const colorForPriority = (p?: string) => {
    switch ((p || '').toLowerCase()) {
      case 'urgent': return '#dc2626';
      case 'high': return '#f97316';
      case 'medium': return '#0ea5e9';
      case 'low': return '#16a34a';
      default: return '#64748b';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generated Tasks</h1>
            <p className="text-gray-600">View tasks by list or timeline</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
            </div>
            <div className="flex border rounded-lg p-1">
              <Button size="sm" variant={view==='list'?'default':'ghost'} onClick={() => setView('list')} className="gap-2"><List className="h-4 w-4" />List</Button>
              <Button size="sm" variant={view==='timeline'?'default':'ghost'} onClick={() => setView('timeline')} className="gap-2"><Rows3 className="h-4 w-4" />Timeline</Button>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-10 text-center text-gray-500">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="py-10 text-center text-gray-500">No tasks for this date</div>
            ) : view === 'list' ? (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipe/Step</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map(t => (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <div className="font-medium text-gray-900">{t.title}</div>
                          <div className="text-xs text-gray-500">{(t as any).type || (t as any).procedure}</div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {(t as any).notes || ''}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 capitalize">{(t as any).priority || 'medium'}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {t.dueDate ? format(new Date(t.dueDate as any), 'HH:mm') : '--'}
                          {((t as any).estimatedDuration ? ` • ${(t as any).estimatedDuration}m` : '')}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{(t as any).location || '—'}</td>
                        <td className="px-6 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => router.push(`/admin/tasks/${t._id}`)} className="gap-2"><Eye className="h-4 w-4" />View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {Object.entries(timelineRows).map(([loc, rowTasks]) => (
                  <div key={loc}>
                    <div className="text-sm font-medium text-gray-700 mb-2">{loc}</div>
                    <div className="relative w-full border rounded h-20 bg-white">
                      {/* simple 4am-10am scale */}
                      <div className="absolute inset-0">
                        {[240,300,360,420,480,540,600].map((m, i) => (
                          <div key={i} className="absolute top-0 bottom-0 border-l border-gray-100" style={{ left: `${((m-240)/(600-240))*100}%` }} />
                        ))}
                      </div>
                      {rowTasks.map((t, i) => {
                        const start = Math.max(240, getStartMinutes(t.dueDate as any));
                        const widthMin = getDuration(t);
                        const leftPct = ((start-240)/(600-240))*100;
                        const widthPct = (widthMin/(600-240))*100;
                        const bg = colorForType((t as any).type) || colorForPriority((t as any).priority);
                        return (
                          <div key={t._id} className="absolute top-2 h-12 rounded text-xs text-white px-2 flex items-center"
                            style={{ left: `${leftPct}%`, width: `${Math.max(6, widthPct)}%`, backgroundColor: bg }}
                            title={`${t.title} • ${t.dueDate ? format(new Date(t.dueDate as any), 'HH:mm') : ''}`}
                          >
                            <span className="truncate">{t.title}</span>
                          </div>
                        );
                      })}
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


