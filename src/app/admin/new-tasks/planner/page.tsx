'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { DayPlan, RecipeProcess, DayPlanSelectedRecipe } from '@/types';
import api from '@/lib/api';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { 
  Calendar, 
  Plus, 
  Save, 
  Utensils, 
  ArrowLeft, 
  Clock, 
  Users, 
  Trash2,
  Play,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function DayPlannerPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shift, setShift] = useState<'morning' | 'evening' | 'other'>('morning');
  const [availableRecipes, setAvailableRecipes] = useState<RecipeProcess[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<DayPlanSelectedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentDayPlan, setCurrentDayPlan] = useState<DayPlan | null>(null);
  const [existingDayPlans, setExistingDayPlans] = useState<DayPlan[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/dashboard');
        return;
      }
      // Check if user is admin or employee
      const isAdminOrEmployee = isAdmin || user?.role === 'employee';
      if (!isAdminOrEmployee) {
        router.push('/dashboard');
        return;
      }
      fetchInitialData();
    }
  }, [authLoading, user, isAdmin]);

  useEffect(() => {
    if (date) {
      fetchDayPlanForDate(date);
      fetchExistingDayPlans();
    }
  }, [date]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const recipesRes = await api.get('/recipe-processes');
      if (recipesRes.ok) {
        const data = await recipesRes.json();
        setAvailableRecipes(data.recipeProcesses || []);
      } else {
        toast.error('Failed to load recipe processes');
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Error loading initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDayPlanForDate = async (selectedDate: string) => {
    try {
      const res = await api.get(`/day-plans?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        const plans = data.plans || data.dayPlans || [];
        if (plans.length > 0) {
          const plan = plans[0];
          setCurrentDayPlan(plan);
          setShift(plan.shift || 'morning');
          setSelectedRecipes((plan.selectedRecipes || []).map((sr: any) => ({
            recipe: (sr.recipe && (sr.recipe._id || sr.recipe)) || (sr.recipeId && (sr.recipeId._id || sr.recipeId)),
            plannedStart: sr.plannedStart,
          })));
        } else {
          setCurrentDayPlan(null);
          setSelectedRecipes([]);
        }
      }
    } catch (error) {
      console.error('Error fetching day plan:', error);
    }
  };

  const fetchExistingDayPlans = async () => {
    try {
      const res = await api.get(`/day-plans`);
      if (res.ok) {
        const data = await res.json();
        setExistingDayPlans((data.plans || data.dayPlans || []).slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (error) {
      console.error('Error fetching existing day plans:', error);
    }
  };

  const handleAddRecipe = (recipeId: string) => {
    const recipe = availableRecipes.find(r => r._id === recipeId);
    if (recipe && !selectedRecipes.some(sr => (typeof sr.recipe === 'string' ? sr.recipe : sr.recipe._id) === recipeId)) {
      const newSelectedRecipe: DayPlanSelectedRecipe = {
        recipe: recipeId,
        plannedStart: '06:00'
      };
      setSelectedRecipes([...selectedRecipes, newSelectedRecipe]);
    }
  };

  const handleRemoveRecipe = (recipeId: string) => {
    setSelectedRecipes(selectedRecipes.filter(sr => (typeof sr.recipe === 'string' ? sr.recipe : sr.recipe._id) !== recipeId));
  };

  const handleRecipeChange = (recipeId: string, field: 'plannedStart', value: string) => {
    setSelectedRecipes(selectedRecipes.map(sr =>
      (typeof sr.recipe === 'string' ? sr.recipe : sr.recipe._id) === recipeId ? { ...sr, [field]: value } : sr
    ));
  };

  const handleSaveDayPlan = async () => {
    if (selectedRecipes.length === 0) {
      toast.error('Please select at least one recipe');
      return;
    }

    setSaving(true);
    try {
          const payload = {
            date,
            shift,
            selectedRecipes: selectedRecipes.map(sr => ({
              recipe: typeof sr.recipe === 'string' ? sr.recipe : sr.recipe._id,
              plannedStart: sr.plannedStart,
            })),
          };

      const res = await api.post('/day-plans', payload);

      if (res.ok) {
        const data = await res.json();
        const plan = data.plan || data.dayPlan;
        setCurrentDayPlan(plan);
        toast.success('Day plan saved successfully!');
        fetchExistingDayPlans();
        // Auto generate tasks after save
        if (plan?._id) {
          const genRes = await api.post(`/day-plans/${plan._id}/generate-tasks`);
          if (genRes.ok) {
            const g = await genRes.json();
            toast.success(g.message || 'Tasks generated');
            router.push(`/admin/new-tasks/tasks?date=${date}`);
          } else {
            const ge = await genRes.json();
            toast.error(ge.message || 'Failed to generate tasks');
          }
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to save day plan');
      }
    } catch (error) {
      console.error('Error saving day plan:', error);
      toast.error('Error saving day plan');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!currentDayPlan?._id) {
      toast.error('Please save the day plan first');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post(`/day-plans/${currentDayPlan._id}/generate-tasks`);
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Tasks generated successfully!');
        router.push(`/admin/new-tasks/tasks?date=${date}`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to generate tasks');
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast.error('Error generating tasks');
    } finally {
      setGenerating(false);
    }
  };

  const duplicateDayPlan = (dayPlan: DayPlan) => {
    setDate(format(parseISO(dayPlan.date), 'yyyy-MM-dd'));
    setShift(dayPlan.shift || 'morning');
    setSelectedRecipes(dayPlan.selectedRecipes.map(sr => ({
      recipe: typeof sr.recipe === 'string' ? sr.recipe : sr.recipe._id,
      plannedStart: sr.plannedStart,
    })));
    setCurrentDayPlan(null);
    toast.success('Day plan loaded for editing');
  };

  const getRecipeName = (recipe: string | RecipeProcess) => {
    const recipeObj = typeof recipe === 'string' ? availableRecipes.find(r => r._id === recipe) : recipe;
    return recipeObj?.name || 'Unknown Recipe';
  };

  const getRecipeDescription = (recipe: string | RecipeProcess) => {
    const recipeObj = typeof recipe === 'string' ? availableRecipes.find(r => r._id === recipe) : recipe;
    return recipeObj?.description || '';
  };

  const getRecipeSteps = (recipe: string | RecipeProcess) => {
    const recipeObj = typeof recipe === 'string' ? availableRecipes.find(r => r._id === recipe) : recipe;
    return recipeObj?.steps?.length || 0;
  };

  const getTotalTasks = () => {
    return selectedRecipes.reduce((total, sr) => {
      const recipeObj = typeof sr.recipe === 'string' ? availableRecipes.find(r => r._id === sr.recipe) : sr.recipe;
      const recipeTasks = recipeObj?.steps?.reduce((stepTotal, step) => stepTotal + (step.tasks?.length || 0), 0) || 0;
      return total + recipeTasks;
    }, 0);
  };

  const getEstimatedDuration = () => {
    return selectedRecipes.reduce((total, sr) => {
      const recipeObj = typeof sr.recipe === 'string' ? availableRecipes.find(r => r._id === sr.recipe) : sr.recipe;
      const recipeDuration = recipeObj?.steps?.reduce((stepTotal, step) => 
        stepTotal + (step.estimatedDurationMin || 30), 0) || 0;
      return total + recipeDuration;
    }, 0);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/admin/new-tasks')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to New Task Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Day Planner</h1>
            <p className="text-gray-600 text-sm">Plan recipe processes and generate tasks for the day</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Planning Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Plan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                    <Input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Shift</label>
                    <Select value={shift} onValueChange={(value: 'morning' | 'evening' | 'other') => setShift(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quick Date Navigation */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Quick navigation:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDate(format(subDays(parseISO(date), 1), 'yyyy-MM-dd'))}
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
                  >
                    Tomorrow
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recipe Selection */}
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-5 w-5" />
                      Recipe Process Selection
                    </div>
                  <Select onValueChange={handleAddRecipe}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Add Recipe Process" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRecipes.filter(recipe => 
                        !selectedRecipes.some(sr => (typeof sr.recipe === 'string' ? sr.recipe : sr.recipe._id) === recipe._id)
                      ).map(recipe => (
                        <SelectItem key={recipe._id} value={recipe._id}>
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4" />
                            {recipe.name}
                            <Badge variant="outline" className="text-xs">
                              {recipe.steps?.length || 0} steps
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRecipes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recipe processes selected for this day plan.</p>
                    <p className="text-sm">Use the dropdown above to add recipe processes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedRecipes.map((sr, index) => {
                      const recipeId = typeof sr.recipe === 'string' ? sr.recipe : sr.recipe._id;
                      return (
                        <Card key={recipeId} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{getRecipeName(sr.recipe)}</h4>
                                <p className="text-sm text-gray-600 mb-2">{getRecipeDescription(sr.recipe)}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Utensils className="h-3 w-3" />
                                    {getRecipeSteps(sr.recipe)} steps
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveRecipe(recipeId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Start Time</label>
                                <Input
                                  type="time"
                                  value={sr.plannedStart || '06:00'}
                                  onChange={(e) => handleRecipeChange(recipeId, 'plannedStart', e.target.value)}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={handleSaveDayPlan} 
                      disabled={saving || selectedRecipes.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Day Plan'}
                    </Button>
                    
                    {currentDayPlan && (
                      <Button 
                        onClick={handleGenerateTasks} 
                        disabled={generating}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        {generating ? 'Generating...' : 'Generate Tasks'}
                      </Button>
                    )}
                  </div>

                  {currentDayPlan && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Plan saved
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedRecipes.length}</div>
                  <div className="text-sm text-blue-600">Recipe Processes</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{getTotalTasks()}</div>
                    <div className="text-sm text-green-600">Tasks</div>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-600">Estimated Duration</span>
                  </div>
                  <div className="text-lg font-bold text-amber-600">
                    {Math.floor(getEstimatedDuration() / 60)}h {getEstimatedDuration() % 60}m
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div>Date: {format(parseISO(date), 'MMMM do, yyyy')}</div>
                  <div>Shift: {shift.charAt(0).toUpperCase() + shift.slice(1)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Day Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {existingDayPlans.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No recent day plans
                  </div>
                ) : (
                  <div className="space-y-3">
                    {existingDayPlans.slice(0, 5).map(plan => (
                      <div key={plan._id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">
                            {format(parseISO(plan.date), 'MMM do')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateDayPlan(plan)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/new-tasks/tasks?date=${format(parseISO(plan.date), 'yyyy-MM-dd')}`)}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {plan.shift} • {plan.selectedRecipes.length} recipe processes
                          {plan.generatedAt && (
                            <div className="flex items-center gap-1 mt-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Tasks generated
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Recipes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Recipe Processes</CardTitle>
              </CardHeader>
              <CardContent>
                {availableRecipes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No recipe processes available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableRecipes.slice(0, 5).map(recipe => (
                      <div key={recipe._id} className="p-2 border rounded text-sm">
                        <div className="font-medium">{recipe.name}</div>
                        <div className="text-xs text-gray-500">
                          {recipe.steps?.length || 0} steps
                        </div>
                      </div>
                    ))}
                    {availableRecipes.length > 5 && (
                      <div className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/admin/products')}
                        >
                          Go to Product Management
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}