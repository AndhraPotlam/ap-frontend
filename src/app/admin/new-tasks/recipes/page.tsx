'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { LegacyRecipeProcess, RecipeStep, StepTaskTemplate, TaskPriority, TaskType, User, Product } from '@/types';
import api from '@/lib/api';
import { 
  Plus, 
  Save, 
  X, 
  GripVertical, 
  Clock, 
  User as UserIcon, 
  Package, 
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Copy,
  Tag,
  ChefHat
} from 'lucide-react';
import { toast } from 'sonner';

export default function RecipesPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();
  const [recipes, setRecipes] = useState<LegacyRecipeProcess[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<LegacyRecipeProcess | null>(null);
  const [form, setForm] = useState<{ 
    name: string; 
    description?: string; 
    category?: string;
    steps: RecipeStep[] 
  }>({
    name: '',
    description: '',
    category: 'uncategorized',
    steps: []
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) { router.push('/auth/login'); return; }
      // Check if user is admin or employee
      const isAdminOrEmployee = isAdmin || user?.role === 'employee';
      if (!isAdminOrEmployee) { router.push('/dashboard'); return; }
      loadData();
    }
  }, [isLoading, user, isAdmin]);

  const loadData = async () => {
    try {
      const [recipesRes, usersRes, productsRes] = await Promise.all([
        api.get('/recipe-processes'),
        api.get('/users'),
        api.get('/products?limit=1000')
      ]);

      if (recipesRes.ok) {
        const data = await recipesRes.json();
        setRecipes(data.recipeProcesses || []);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data');
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'uncategorized', steps: [] });
    setEditingRecipe(null);
  };

  const addStep = () => {
    const newStep: RecipeStep = {
      name: '',
      order: form.steps.length + 1,
      instructions: '',
      location: '',
      estimatedDurationMin: 30,
      tasks: []
    };
    setForm({ ...form, steps: [...form.steps, newStep] });
  };

  const removeStep = (stepIndex: number) => {
    const newSteps = form.steps.filter((_, index) => index !== stepIndex);
    // Reorder steps
    const reorderedSteps = newSteps.map((step, index) => ({ ...step, order: index + 1 }));
    setForm({ ...form, steps: reorderedSteps });
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    const newSteps = [...form.steps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);
    // Reorder steps
    const reorderedSteps = newSteps.map((step, index) => ({ ...step, order: index + 1 }));
    setForm({ ...form, steps: reorderedSteps });
  };

  const addTaskToStep = (stepIndex: number) => {
    const newTask: StepTaskTemplate = {
      name: '',
      description: '',
      type: 'other',
      procedure: '',
      priority: 'medium',
      itemsUsed: [],
      defaultAssignees: [],
      timeWindow: { startOffsetMin: 0, durationMin: 15 },
      taskFor: [],
      tags: [],
      location: ''
    };
    
    const newSteps = [...form.steps];
    newSteps[stepIndex].tasks.push(newTask);
    setForm({ ...form, steps: newSteps });
  };

  const removeTaskFromStep = (stepIndex: number, taskIndex: number) => {
    const newSteps = [...form.steps];
    newSteps[stepIndex].tasks = newSteps[stepIndex].tasks.filter((_, index) => index !== taskIndex);
    setForm({ ...form, steps: newSteps });
  };

  const moveTask = (stepIndex: number, fromIndex: number, toIndex: number) => {
    const newSteps = [...form.steps];
    const [movedTask] = newSteps[stepIndex].tasks.splice(fromIndex, 1);
    newSteps[stepIndex].tasks.splice(toIndex, 0, movedTask);
    setForm({ ...form, steps: newSteps });
  };

  const updateStep = (stepIndex: number, field: keyof RecipeStep, value: any) => {
    const newSteps = [...form.steps];
    newSteps[stepIndex] = { ...newSteps[stepIndex], [field]: value };
    setForm({ ...form, steps: newSteps });
  };

  const updateTask = (stepIndex: number, taskIndex: number, field: keyof StepTaskTemplate, value: any) => {
    const newSteps = [...form.steps];
    newSteps[stepIndex].tasks[taskIndex] = { 
      ...newSteps[stepIndex].tasks[taskIndex], 
      [field]: value 
    };
    setForm({ ...form, steps: newSteps });
  };

  const addAssignee = (stepIndex: number, taskIndex: number, userId: string) => {
    const newSteps = [...form.steps];
    const currentAssignees = (newSteps[stepIndex].tasks[taskIndex].defaultAssignees || []) as any[];
    if (!currentAssignees.some((a) => (typeof a === 'string' ? a : a._id) === userId)) {
      newSteps[stepIndex].tasks[taskIndex].defaultAssignees = [...currentAssignees, userId] as any;
    }
    setForm({ ...form, steps: newSteps });
  };

  const removeAssignee = (stepIndex: number, taskIndex: number, userId: string) => {
    const newSteps = [...form.steps];
    newSteps[stepIndex].tasks[taskIndex].defaultAssignees = 
      (newSteps[stepIndex].tasks[taskIndex].defaultAssignees || []).filter((a: any) => (typeof a === 'string' ? a : a._id) !== userId) as any;
    setForm({ ...form, steps: newSteps });
  };

  const addItemUsed = (stepIndex: number, taskIndex: number, item: string) => {
    if (!item.trim()) return;
    
    const newSteps = [...form.steps];
    const currentItems = newSteps[stepIndex].tasks[taskIndex].itemsUsed || [];
    if (!currentItems.includes(item.trim())) {
      newSteps[stepIndex].tasks[taskIndex].itemsUsed = [...currentItems, item.trim()];
    }
    setForm({ ...form, steps: newSteps });
  };

  const removeItemUsed = (stepIndex: number, taskIndex: number, item: string) => {
    const newSteps = [...form.steps];
    newSteps[stepIndex].tasks[taskIndex].itemsUsed = 
      (newSteps[stepIndex].tasks[taskIndex].itemsUsed || []).filter(i => i !== item);
    setForm({ ...form, steps: newSteps });
  };

  const addTaskFor = (stepIndex: number, taskIndex: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    const newSteps = [...form.steps];
    const currentTaskFor = newSteps[stepIndex].tasks[taskIndex].taskFor || [];
    if (!currentTaskFor.includes(product.name)) {
      newSteps[stepIndex].tasks[taskIndex].taskFor = [...currentTaskFor, product.name];
    }
    setForm({ ...form, steps: newSteps });
  };

  const removeTaskFor = (stepIndex: number, taskIndex: number, productName: string) => {
    const newSteps = [...form.steps];
    newSteps[stepIndex].tasks[taskIndex].taskFor = 
      (newSteps[stepIndex].tasks[taskIndex].taskFor || []).filter(p => p !== productName);
    setForm({ ...form, steps: newSteps });
  };

  const saveRecipe = async () => {
    if (!form.name.trim()) {
      toast.error('Recipe name is required');
      return;
    }

    if (form.steps.length === 0) {
      toast.error('At least one step is required');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        ...form,
        steps: form.steps.map(step => ({
          ...step,
          tasks: step.tasks.map(task => ({
            ...task,
            defaultAssignees: (task.defaultAssignees || []).map((a: any) => typeof a === 'string' ? a : a._id) // IDs only
          }))
        }))
      };

      let res;
      if (editingRecipe) {
        res = await api.put(`/recipe-processes/${editingRecipe._id}`, payload);
      } else {
        res = await api.post('/recipe-processes', payload);
      }

      if (res.ok) {
        toast.success(editingRecipe ? 'Recipe process updated successfully!' : 'Recipe process created successfully!');
        resetForm();
        loadData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to save recipe process');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Error saving recipe process');
    } finally {
      setCreating(false);
    }
  };

  const editRecipe = (recipe: LegacyRecipeProcess) => {
    setEditingRecipe(recipe);
    setForm({
      name: recipe.name,
      description: recipe.description || '',
      category: recipe.category || 'uncategorized',
      steps: recipe.steps || []
    });
    // Scroll to form
    document.getElementById('recipe-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const duplicateRecipe = (recipe: LegacyRecipeProcess) => {
    setForm({
      name: `${recipe.name} (Copy)`,
      description: recipe.description || '',
      category: recipe.category || 'uncategorized',
      steps: recipe.steps || []
    });
    setEditingRecipe(null);
    document.getElementById('recipe-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe process?')) return;
    
    try {
      const res = await api.delete(`/recipe-processes/${recipeId}`);
      if (res.ok) {
        toast.success('Recipe process deleted successfully');
        loadData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to delete recipe process');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Error deleting recipe process');
    }
  };

  const getTaskTypeColor = (type: TaskType) => {
    const colors = {
      cooking: 'bg-red-100 text-red-800',
      cutting: 'bg-green-100 text-green-800',
      preparing: 'bg-blue-100 text-blue-800',
      cleaning: 'bg-emerald-100 text-emerald-800',
      mixing: 'bg-amber-100 text-amber-800',
      removing: 'bg-teal-100 text-teal-800',
      soaking: 'bg-cyan-100 text-cyan-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || colors.medium;
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/admin/products')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Product Management
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recipe Process Builder</h1>
            <p className="text-gray-600 text-sm">Create and manage recipe processes with steps and tasks</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/products')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Package className="h-6 w-6 text-indigo-600" />
              <div className="ml-3">
                <CardTitle className="text-base">Products</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Manage product catalog
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/categories')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Tag className="h-6 w-6 text-pink-600" />
              <div className="ml-3">
                <CardTitle className="text-base">Categories</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Organize product categories
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-blue-50 border-blue-200" onClick={() => router.push('/admin/new-tasks/recipes')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <ChefHat className="h-6 w-6 text-emerald-600" />
              <div className="ml-3">
                <CardTitle className="text-base">Recipe Processes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create and manage recipe processes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recipe Form */}
        <Card id="recipe-form" className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingRecipe ? 'Edit Recipe Process' : 'New Recipe Process'}
              {editingRecipe && (
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Recipe Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Recipe Process Name *</label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Biryani Preparation Process"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">No Category</SelectItem>
                    {Array.from(new Set(products.map(p => 
                      typeof p.category === 'string' ? p.category : p.category?.name
                    ).filter(Boolean))).map((category, index) => (
                      <SelectItem key={`category-${index}-${category}`} value={category!}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the recipe process, its purpose, and any special notes..."
                rows={3}
              />
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Process Steps</h3>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {form.steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No steps added yet. Click "Add Step" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.steps.map((step, stepIndex) => (
                    <Card key={stepIndex} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                              <Badge variant="outline">Step {step.order}</Badge>
                            </div>
                            <Input
                              value={step.name}
                              onChange={(e) => updateStep(stepIndex, 'name', e.target.value)}
                              placeholder="Step name"
                              className="font-medium"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(stepIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Step Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
                            <Input
                              value={step.location || ''}
                              onChange={(e) => updateStep(stepIndex, 'location', e.target.value)}
                              placeholder="e.g., Kitchen, Prep Area"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (minutes)</label>
                            <Input
                              type="number"
                              value={step.estimatedDurationMin || ''}
                              onChange={(e) => updateStep(stepIndex, 'estimatedDurationMin', Number(e.target.value))}
                              placeholder="30"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Order</label>
                            <Input
                              type="number"
                              value={step.order}
                              onChange={(e) => updateStep(stepIndex, 'order', Number(e.target.value))}
                              min="1"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Instructions</label>
                          <Textarea
                            value={step.instructions || ''}
                            onChange={(e) => updateStep(stepIndex, 'instructions', e.target.value)}
                            placeholder="Detailed instructions for this step..."
                            rows={2}
                          />
                        </div>

                        {/* Tasks */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-semibold">Tasks</h4>
                            <Button variant="outline" size="sm" onClick={() => addTaskToStep(stepIndex)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Task
                            </Button>
                          </div>

                          {step.tasks.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No tasks added yet. Click "Add Task" to create tasks for this step.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {step.tasks.map((task, taskIndex) => (
                                <Card key={taskIndex} className="bg-gray-50 border-gray-200">
                                  <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                        <Input
                                          value={task.name}
                                          onChange={(e) => updateTask(stepIndex, taskIndex, 'name', e.target.value)}
                                          placeholder="Task name"
                                          className="font-medium"
                                        />
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeTaskFromStep(stepIndex, taskIndex)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    {/* Task Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                                        <Select 
                                          value={task.type} 
                                          onValueChange={(value: TaskType) => updateTask(stepIndex, taskIndex, 'type', value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {(['cooking', 'cutting', 'preparing', 'cleaning', 'mixing', 'removing', 'soaking', 'other'] as TaskType[]).map(type => (
                                              <SelectItem key={type} value={type}>
                                                <div className="flex items-center gap-2">
                                                  <Badge className={`${getTaskTypeColor(type)} text-xs`}>
                                                    {type}
                                                  </Badge>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                                        <Select 
                                          value={task.priority} 
                                          onValueChange={(value: TaskPriority) => updateTask(stepIndex, taskIndex, 'priority', value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(priority => (
                                              <SelectItem key={priority} value={priority}>
                                                <div className="flex items-center gap-2">
                                                  <Badge className={`${getPriorityColor(priority)} text-xs`}>
                                                    {priority}
                                                  </Badge>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Start Time (minutes)</label>
                                        <Input
                                          type="number"
                                          value={task.timeWindow.startOffsetMin}
                                          onChange={(e) => updateTask(stepIndex, taskIndex, 'timeWindow', {
                                            ...task.timeWindow,
                                            startOffsetMin: Number(e.target.value)
                                          })}
                                          placeholder="0"
                                          min="0"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (minutes)</label>
                                        <Input
                                          type="number"
                                          value={task.timeWindow.durationMin}
                                          onChange={(e) => updateTask(stepIndex, taskIndex, 'timeWindow', {
                                            ...task.timeWindow,
                                            durationMin: Number(e.target.value)
                                          })}
                                          placeholder="15"
                                          min="1"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                                      <Textarea
                                        value={task.description || ''}
                                        onChange={(e) => updateTask(stepIndex, taskIndex, 'description', e.target.value)}
                                        placeholder="Task description..."
                                        rows={2}
                                      />
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1 block">Procedure</label>
                                      <Textarea
                                        value={task.procedure || ''}
                                        onChange={(e) => updateTask(stepIndex, taskIndex, 'procedure', e.target.value)}
                                        placeholder="Step-by-step procedure..."
                                        rows={2}
                                      />
                                    </div>

                                    {/* Assignees */}
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1 block">Default Assignees</label>
                                      <div className="flex gap-2 mb-2">
                                        <Select onValueChange={(userId) => addAssignee(stepIndex, taskIndex, userId)}>
                                          <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select user to assign" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {users.map(user => (
                                              <SelectItem key={user._id} value={user._id}>
                                                <div className="flex items-center gap-2">
                                                  <UserIcon className="h-4 w-4" />
                                                  {user.firstName} {user.lastName}
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {(task.defaultAssignees || []).map((assignee: any) => {
                                          const id = typeof assignee === 'string' ? assignee : assignee._id;
                                          const display = typeof assignee === 'string' 
                                            ? (users.find(u => u._id === assignee)?.firstName || assignee)
                                            : `${assignee.firstName} ${assignee.lastName}`;
                                          return (
                                            <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                              <UserIcon className="h-3 w-3" />
                                              {display}
                                              <button
                                                onClick={() => removeAssignee(stepIndex, taskIndex, id)}
                                                className="ml-1 hover:text-red-600"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Items Used */}
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1 block">Items Used</label>
                                      <div className="flex gap-2 mb-2">
                                        <Input
                                          placeholder="Add item (e.g., knife, cutting board)"
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              addItemUsed(stepIndex, taskIndex, e.currentTarget.value);
                                              e.currentTarget.value = '';
                                            }
                                          }}
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                            addItemUsed(stepIndex, taskIndex, input.value);
                                            input.value = '';
                                          }}
                                        >
                                          Add
                                        </Button>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {(task.itemsUsed || []).map((item, itemIndex) => (
                                          <Badge key={itemIndex} variant="outline" className="flex items-center gap-1">
                                            <Package className="h-3 w-3" />
                                            {item}
                                            <button
                                              onClick={() => removeItemUsed(stepIndex, taskIndex, item)}
                                              className="ml-1 hover:text-red-600"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Task For (Products) */}
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1 block">Task For (Products)</label>
                                      <div className="flex gap-2 mb-2">
                                        <Select onValueChange={(productId) => addTaskFor(stepIndex, taskIndex, productId)}>
                                          <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select product" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {products.map(product => (
                                              <SelectItem key={product._id} value={product._id}>
                                                <div className="flex items-center gap-2">
                                                  <Package className="h-4 w-4" />
                                                  {product.name}
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {(task.taskFor || []).map((productName, productIndex) => (
                                          <Badge key={productIndex} variant="outline" className="flex items-center gap-1">
                                            <Package className="h-3 w-3" />
                                            {productName}
                                            <button
                                              onClick={() => removeTaskFor(stepIndex, taskIndex, productName)}
                                              className="ml-1 hover:text-red-600"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={saveRecipe} disabled={creating || !form.name.trim() || form.steps.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                {creating ? 'Saving...' : (editingRecipe ? 'Update Recipe Process' : 'Save Recipe Process')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Recipes */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Recipe Processes ({recipes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No recipe processes created yet. Create your first recipe process above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map(recipe => (
                  <Card key={recipe._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{recipe.name}</CardTitle>
                          {recipe.category && (
                            <Badge variant="outline" className="mt-1">{recipe.category}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editRecipe(recipe)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateRecipe(recipe)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRecipe(recipe._id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {recipe.description || 'No description provided'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{recipe.steps?.length || 0} steps</span>
                        {recipe.category && (
                          <Badge variant="outline" className="text-xs">
                            {recipe.category}
                          </Badge>
                        )}
                      </div>
                      {/* createdAt may not be present in type; show if available */}
                      {('createdAt' in recipe) && (
                        <div className="mt-2 text-xs text-gray-400">
                          Created: {new Date((recipe as any).createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}