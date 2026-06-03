'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { Recipe, RecipeStep, StepTaskTemplate, TaskPriority, TaskType, User, Product } from '@/types';
import api from '@/lib/api';
import { Plus, Save, X } from 'lucide-react';

export default function RecipesPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ name: string; description?: string; serves?: number; steps: RecipeStep[] }>({ name: '', description: '', serves: 50, steps: [] });
  const [assigneePicker, setAssigneePicker] = useState<Record<number, string>>({});
  const [itemInput, setItemInput] = useState<Record<number, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [taskForPicker, setTaskForPicker] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!isLoading) {
      if (!user) { router.push('/auth/login'); return; }
      if (!isAdmin) { router.push('/dashboard'); return; }
      load();
      loadUsers();
      loadProducts();
    }
  }, [isLoading, user, isAdmin]);

  const load = async () => {
    const res = await api.get('/recipes');
    if (res.ok) {
      const data = await res.json();
      setRecipes(data.recipes || []);
    }
  };

  const loadUsers = async () => {
    const res = await api.get('/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
  };

  const loadProducts = async () => {
    const res = await api.get('/products');
    if (res.ok) {
      const data = await res.json();
      // accommodate either {products} or raw array
      setProducts((data.products || data) as Product[]);
    }
  };

  const addStep = () => {
    setForm({ ...form, steps: [...form.steps, { name: '', order: (form.steps.length || 0) + 1, tasks: [] }] });
  };

  const addTaskToStep = (idx: number) => {
    const next = [...form.steps];
    const task: StepTaskTemplate = {
      name: '',
      type: 'other',
      priority: 'medium',
      timeWindow: { startOffsetMin: 0, durationMin: 5 },
      taskFor: [],
      canRunInParallel: true,
      blocking: false,
      qaChecks: [],
      dependsOn: []
    } as any;
    next[idx].tasks.push(task);
    setForm({ ...form, steps: next });
  };

  const save = async () => {
    setCreating(true);
    const res = await api.post('/recipes', form);
    setCreating(false);
    if (res.ok) {
      setForm({ name: '', description: '', serves: 50, steps: [] });
      load();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
            <p className="text-gray-600">Create recipes with steps and per-step tasks</p>
          </div>
          <Button onClick={save} disabled={creating}><Save className="h-4 w-4 mr-2" />Save Recipe</Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Recipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Serves</label>
                <Input type="number" value={form.serves} onChange={(e) => setForm({ ...form, serves: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="flex items-center justify-between mt-2">
              <h3 className="text-base font-semibold">Steps</h3>
              <Button variant="outline" size="sm" onClick={addStep}><Plus className="h-4 w-4 mr-2" />Add Step</Button>
            </div>
            <div className="space-y-4">
              {form.steps.map((step, idx) => (
                <div key={idx} className="border rounded p-3 space-y-2">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Step Name</label>
                      <Input value={step.name} onChange={(e) => {
                        const next = [...form.steps];
                        next[idx].name = e.target.value;
                        setForm({ ...form, steps: next });
                      }} />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Order</label>
                      <Input type="number" value={step.order} onChange={(e) => {
                        const next = [...form.steps];
                        next[idx].order = Number(e.target.value);
                        setForm({ ...form, steps: next });
                      }} />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Location</label>
                      <Input value={step.location || ''} onChange={(e) => {
                        const next = [...form.steps];
                        next[idx].location = e.target.value;
                        setForm({ ...form, steps: next });
                      }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Instructions</label>
                    <Textarea value={step.instructions || ''} onChange={(e) => {
                      const next = [...form.steps];
                      next[idx].instructions = e.target.value;
                      setForm({ ...form, steps: next });
                    }} />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <h4 className="text-sm font-semibold">Tasks</h4>
                    <Button variant="outline" size="sm" onClick={() => addTaskToStep(idx)}><Plus className="h-4 w-4 mr-2" />Add Task</Button>
                  </div>
                  <div className="space-y-3">
                    {step.tasks.map((t, tIdx) => (
                      <div key={tIdx} className="grid sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Task Name</label>
                          <Input value={t.name} onChange={(e) => {
                            const next = [...form.steps];
                            next[idx].tasks[tIdx].name = e.target.value;
                            setForm({ ...form, steps: next });
                          }} />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Type</label>
                          <Select value={t.type} onValueChange={(v: any) => {
                            const next = [...form.steps];
                            next[idx].tasks[tIdx].type = v as TaskType;
                            setForm({ ...form, steps: next });
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(['cooking','cutting','preparing','cleaning','mixing','removing','soaking','other'] as TaskType[]).map(tp => (
                                <SelectItem key={tp} value={tp}>{tp}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Priority</label>
                          <Select value={t.priority} onValueChange={(v: any) => {
                            const next = [...form.steps];
                            next[idx].tasks[tIdx].priority = v as TaskPriority;
                            setForm({ ...form, steps: next });
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(['low','medium','high','urgent'] as TaskPriority[]).map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block">Start +Min</label>
                            <Input type="number" value={t.timeWindow.startOffsetMin}
                              onChange={(e) => {
                                const next = [...form.steps];
                                next[idx].tasks[tIdx].timeWindow.startOffsetMin = Number(e.target.value);
                                setForm({ ...form, steps: next });
                              }} />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Duration Min</label>
                            <Input type="number" value={t.timeWindow.durationMin}
                              onChange={(e) => {
                                const next = [...form.steps];
                                next[idx].tasks[tIdx].timeWindow.durationMin = Number(e.target.value);
                                setForm({ ...form, steps: next });
                              }} />
                          </div>
                        </div>
                        <div className="sm:col-span-4">
                          <label className="text-xs font-medium mb-1 block">Acceptance Criteria</label>
                          <Textarea value={t.acceptanceCriteria || ''} onChange={(e) => {
                            const next = [...form.steps];
                            next[idx].tasks[tIdx].acceptanceCriteria = e.target.value;
                            setForm({ ...form, steps: next });
                          }} />
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:col-span-4">
                          <div>
                            <label className="text-xs font-medium mb-1 block">Quantity</label>
                            <Input type="number" value={t.quantity || 0} onChange={(e) => {
                              const next = [...form.steps];
                              next[idx].tasks[tIdx].quantity = Number(e.target.value);
                              setForm({ ...form, steps: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Unit</label>
                            <Input value={t.unit || ''} onChange={(e) => {
                              const next = [...form.steps];
                              next[idx].tasks[tIdx].unit = e.target.value;
                              setForm({ ...form, steps: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Parallel/Blocking</label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant={t.canRunInParallel ? 'default' : 'outline'} size="sm" onClick={() => {
                                const next = [...form.steps];
                                next[idx].tasks[tIdx].canRunInParallel = !t.canRunInParallel;
                                setForm({ ...form, steps: next });
                              }}>Parallel</Button>
                              <Button variant={t.blocking ? 'default' : 'outline'} size="sm" onClick={() => {
                                const next = [...form.steps];
                                next[idx].tasks[tIdx].blocking = !t.blocking;
                                setForm({ ...form, steps: next });
                              }}>Blocking</Button>
                            </div>
                          </div>
                        </div>
                        <div className="sm:col-span-4 grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block">Assignees</label>
                            <div className="flex gap-2">
                              <Select value={assigneePicker[tIdx] || ''} onValueChange={(v) => {
                                setAssigneePicker({ ...assigneePicker, [tIdx]: v });
                              }}>
                                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                                <SelectContent>
                                  {users.map(u => (
                                    <SelectItem key={u._id} value={u._id}>{u.firstName} {u.lastName || ''}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button variant="outline" size="sm" onClick={() => {
                                const id = assigneePicker[tIdx];
                                if (!id) return;
                                const next = [...form.steps];
                                const list = next[idx].tasks[tIdx].defaultAssignees || [];
                                if (!list.includes(id)) list.push(id);
                                next[idx].tasks[tIdx].defaultAssignees = list;
                                setForm({ ...form, steps: next });
                                setAssigneePicker({ ...assigneePicker, [tIdx]: '' });
                              }}>Add</Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(t.defaultAssignees || []).map((uid, ai) => {
                                const u = users.find(x => x._id === uid);
                                return (
                                  <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs">
                                    {u ? `${u.firstName} ${u.lastName || ''}` : uid}
                                    <button onClick={() => {
                                      const next = [...form.steps];
                                      next[idx].tasks[tIdx].defaultAssignees = (next[idx].tasks[tIdx].defaultAssignees || []).filter(x => x !== uid);
                                      setForm({ ...form, steps: next });
                                    }} aria-label="Remove">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Items Used</label>
                            <div className="flex gap-2">
                              <Input value={itemInput[tIdx] || ''} onChange={(e) => setItemInput({ ...itemInput, [tIdx]: e.target.value })} placeholder="Add item" />
                              <Button variant="outline" size="sm" onClick={() => {
                                const val = (itemInput[tIdx] || '').trim();
                                if (!val) return;
                                const next = [...form.steps];
                                const list = next[idx].tasks[tIdx].itemsUsed || [];
                                list.push(val);
                                next[idx].tasks[tIdx].itemsUsed = list;
                                setForm({ ...form, steps: next });
                                setItemInput({ ...itemInput, [tIdx]: '' });
                              }}>Add</Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(t.itemsUsed || []).map((it, ii) => (
                                <span key={`${it}-${ii}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs">
                                  {it}
                                  <button onClick={() => {
                                    const next = [...form.steps];
                                    next[idx].tasks[tIdx].itemsUsed = (next[idx].tasks[tIdx].itemsUsed || []).filter(x => x !== it);
                                    setForm({ ...form, steps: next });
                                  }} aria-label="Remove"><X className="h-3 w-3" /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium mb-1 block">Task For (Products)</label>
                            <div className="flex gap-2">
                              <Select value={taskForPicker[tIdx] || ''} onValueChange={(v) => setTaskForPicker({ ...taskForPicker, [tIdx]: v })}>
                                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                                <SelectContent>
                                  {products.map(p => (
                                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button variant="outline" size="sm" onClick={() => {
                                const pid = taskForPicker[tIdx];
                                if (!pid) return;
                                const prod = products.find(pr => pr._id === pid);
                                if (!prod) return;
                                const next = [...form.steps];
                                const list = next[idx].tasks[tIdx].taskFor || [];
                                if (!list.includes(prod.name)) list.push(prod.name);
                                next[idx].tasks[tIdx].taskFor = list;
                                setForm({ ...form, steps: next });
                                setTaskForPicker({ ...taskForPicker, [tIdx]: '' });
                              }}>Add</Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(t.taskFor || []).map((tf, ti) => (
                                <span key={`${tf}-${ti}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs">
                                  {tf}
                                  <button onClick={() => {
                                    const next = [...form.steps];
                                    next[idx].tasks[tIdx].taskFor = (next[idx].tasks[tIdx].taskFor || []).filter(x => x !== tf);
                                    setForm({ ...form, steps: next });
                                  }} aria-label="Remove"><X className="h-3 w-3" /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium mb-1 block">Required Skills</label>
                            <div className="flex gap-2">
                              <Input value={itemInput[`skill-${tIdx}` as any] || ''} onChange={(e) => setItemInput({ ...itemInput, [`skill-${tIdx}`]: e.target.value })} placeholder="Add skill" />
                              <Button variant="outline" size="sm" onClick={() => {
                                const val = (itemInput[`skill-${tIdx}` as any] || '').trim();
                                if (!val) return;
                                const next = [...form.steps];
                                const list = next[idx].tasks[tIdx].requiredSkills || [];
                                list.push(val);
                                next[idx].tasks[tIdx].requiredSkills = list;
                                setForm({ ...form, steps: next });
                                setItemInput({ ...itemInput, [`skill-${tIdx}`]: '' } as any);
                              }}>Add</Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(t.requiredSkills || []).map((sk, si) => (
                                <span key={`${sk}-${si}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs">
                                  {sk}
                                  <button onClick={() => {
                                    const next = [...form.steps];
                                    next[idx].tasks[tIdx].requiredSkills = (next[idx].tasks[tIdx].requiredSkills || []).filter(x => x !== sk);
                                    setForm({ ...form, steps: next });
                                  }} aria-label="Remove"><X className="h-3 w-3" /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium mb-1 block">Equipment</label>
                            <div className="flex gap-2">
                              <Input value={itemInput[`equip-${tIdx}` as any] || ''} onChange={(e) => setItemInput({ ...itemInput, [`equip-${tIdx}`]: e.target.value })} placeholder="Add equipment" />
                              <Button variant="outline" size="sm" onClick={() => {
                                const val = (itemInput[`equip-${tIdx}` as any] || '').trim();
                                if (!val) return;
                                const next = [...form.steps];
                                const list = next[idx].tasks[tIdx].equipment || [];
                                list.push(val);
                                next[idx].tasks[tIdx].equipment = list;
                                setForm({ ...form, steps: next });
                                setItemInput({ ...itemInput, [`equip-${tIdx}`]: '' } as any);
                              }}>Add</Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(t.equipment || []).map((eq, ei) => (
                                <span key={`${eq}-${ei}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs">
                                  {eq}
                                  <button onClick={() => {
                                    const next = [...form.steps];
                                    next[idx].tasks[tIdx].equipment = (next[idx].tasks[tIdx].equipment || []).filter(x => x !== eq);
                                    setForm({ ...form, steps: next });
                                  }} aria-label="Remove"><X className="h-3 w-3" /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium mb-1 block">QA Checks</label>
                            <div className="flex gap-2">
                              <Input value={itemInput[`qa-${tIdx}` as any] || ''} onChange={(e) => setItemInput({ ...itemInput, [`qa-${tIdx}`]: e.target.value })} placeholder="Add QA check" />
                              <Button variant="outline" size="sm" onClick={() => {
                                const val = (itemInput[`qa-${tIdx}` as any] || '').trim();
                                if (!val) return;
                                const next = [...form.steps];
                                const list = next[idx].tasks[tIdx].qaChecks || [];
                                list.push(val);
                                next[idx].tasks[tIdx].qaChecks = list;
                                setForm({ ...form, steps: next });
                                setItemInput({ ...itemInput, [`qa-${tIdx}`]: '' } as any);
                              }}>Add</Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(t.qaChecks || []).map((qc, qi) => (
                                <span key={`${qc}-${qi}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs">
                                  {qc}
                                  <button onClick={() => {
                                    const next = [...form.steps];
                                    next[idx].tasks[tIdx].qaChecks = (next[idx].tasks[tIdx].qaChecks || []).filter(x => x !== qc);
                                    setForm({ ...form, steps: next });
                                  }} aria-label="Remove"><X className="h-3 w-3" /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium mb-1 block">Safety Notes</label>
                            <Textarea value={t.safetyNotes || ''} onChange={(e) => {
                              const next = [...form.steps];
                              next[idx].tasks[tIdx].safetyNotes = e.target.value;
                              setForm({ ...form, steps: next });
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recipes.map(r => (
                <div key={r._id} className="p-3 border rounded">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500 truncate">{r.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


