'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { Recipe, DayPlan } from '@/types';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Calendar, Plus, Trash2, Play, Save } from 'lucide-react';

export default function DayPlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isLoading } = useAuth();
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [shift, setShift] = useState<'morning'|'evening'|'other'>('morning');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Array<{ recipeId: string; plannedStart?: string; serves?: number }>>([]);
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) { router.push('/auth/login'); return; }
      if (!isAdmin) { router.push('/dashboard'); return; }
      loadRecipes();
    }
  }, [isLoading, user, isAdmin]);

  const loadRecipes = async () => {
    const res = await api.get('/recipes');
    if (res.ok) {
      const data = await res.json();
      setRecipes(data.recipes || []);
    }
  };

  const addRecipe = (recipeId: string) => {
    if (!recipeId) return;
    if (selected.some(s => s.recipeId === recipeId)) return;
    setSelected([...selected, { recipeId, plannedStart: '05:00', serves: 50 }]);
  };

  const updateSelected = (idx: number, patch: Partial<{ plannedStart: string; serves: number }>) => {
    const next = [...selected];
    next[idx] = { ...next[idx], ...patch };
    setSelected(next);
  };

  const removeSelected = (idx: number) => {
    const next = [...selected];
    next.splice(idx, 1);
    setSelected(next);
  };

  const savePlan = async () => {
    try {
      setSaving(true);
      const body = {
        date,
        shift,
        selectedRecipes: selected.map(s => ({ recipe: s.recipeId, plannedStart: s.plannedStart, serves: s.serves }))
      };
      const res = await api.post('/day-plans', body);
      if (res.ok) {
        const data = await res.json();
        setPlanId(data.plan?._id);
      }
    } finally {
      setSaving(false);
    }
  };

  const generateTasks = async () => {
    if (!planId) { await savePlan(); }
    const id = planId;
    if (!id) return;
    const res = await api.post(`/day-plans/${id}/generate-tasks`, {});
    if (res.ok) {
      router.push('/admin/new-tasks/tasks');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Day Planner</h1>
          <p className="text-gray-600">Select recipes for the day and generate tasks</p>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Shift</label>
              <Select value={shift} onValueChange={(v: any) => setShift(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Add Recipe</label>
              <Select onValueChange={addRecipe}>
                <SelectTrigger><SelectValue placeholder="Select a recipe" /></SelectTrigger>
                <SelectContent>
                  {recipes.map(r => (
                    <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selected Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            {selected.length === 0 ? (
              <div className="text-sm text-gray-500">No recipes added yet.</div>
            ) : (
              <div className="space-y-3">
                {selected.map((s, idx) => {
                  const recipe = recipes.find(r => r._id === s.recipeId);
                  return (
                    <div key={idx} className="border rounded p-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <div className="text-sm font-medium text-gray-900">{recipe?.name || 'Recipe'}</div>
                        <div className="text-xs text-gray-500 truncate">{recipe?.description}</div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Planned Start</label>
                        <Input type="time" value={s.plannedStart || ''} onChange={(e) => updateSelected(idx, { plannedStart: e.target.value })} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => removeSelected(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={savePlan} disabled={saving}><Save className="h-4 w-4 mr-2" />Save Plan</Button>
          <Button onClick={generateTasks}><Play className="h-4 w-4 mr-2" />Generate Tasks</Button>
        </div>
      </div>
    </div>
  );
}


