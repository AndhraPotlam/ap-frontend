'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Save, X, GripVertical, Clock, User as UserIcon, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { RawMaterial, User, RecipeIngredient, RecipeStep, StepTaskTemplate, TaskType, TaskPriority } from '@/types';
import { toast } from 'sonner';

export default function AddRecipePage() {
  const router = useRouter();
  const { user, isAdmin, user: authUser } = useAuth();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'main-course',
    serves: 1,
    prepTimeMin: 0,
    cookTimeMin: 0,
    totalTimeMin: 0,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    cuisine: '',
    ingredients: [] as RecipeIngredient[],
    recipeProcess: {
      name: '',
      description: '',
      steps: [] as RecipeStep[]
    }
  });

  const isAdminOrEmployee = isAdmin || authUser?.role === 'employee';

  useEffect(() => {
    if (!isAdminOrEmployee) {
      router.push('/dashboard');
      return;
    }
    fetchInitialData();
  }, [isAdminOrEmployee, router]);

  const fetchInitialData = async () => {
    try {
      const [rawMaterialsRes, usersRes] = await Promise.all([
        api.get('/raw-materials'),
        api.get('/users')
      ]);

      if (rawMaterialsRes.ok) {
        const data = await rawMaterialsRes.json();
        setRawMaterials(data.rawMaterials || []);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setForm({
      ...form,
      ingredients: [
        ...form.ingredients,
        {
          rawMaterial: '',
          quantity: 0,
          unit: '',
          notes: ''
        }
      ]
    });
  };

  const removeIngredient = (index: number) => {
    setForm({
      ...form,
      ingredients: form.ingredients.filter((_, i) => i !== index)
    });
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updatedIngredients = [...form.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setForm({ ...form, ingredients: updatedIngredients });
  };

  const addStep = () => {
    const newStep: RecipeStep = {
      name: '',
      order: form.recipeProcess.steps.length,
      instructions: '',
      location: '',
      estimatedDurationMin: 0,
      tasks: []
    };
    setForm({
      ...form,
      recipeProcess: {
        ...form.recipeProcess,
        steps: [...form.recipeProcess.steps, newStep]
      }
    });
  };

  const removeStep = (index: number) => {
    setForm({
      ...form,
      recipeProcess: {
        ...form.recipeProcess,
        steps: form.recipeProcess.steps.filter((_, i) => i !== index)
      }
    });
  };

  const updateStep = (index: number, field: keyof RecipeStep, value: any) => {
    const updatedSteps = [...form.recipeProcess.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setForm({
      ...form,
      recipeProcess: {
        ...form.recipeProcess,
        steps: updatedSteps
      }
    });
  };

  const addTask = (stepIndex: number) => {
    const newTask: StepTaskTemplate = {
      name: '',
      description: '',
      type: 'other',
      procedure: '',
      priority: 'medium',
      itemsUsed: [],
      defaultAssignees: [],
      timeWindow: { startOffsetMin: 0, durationMin: 5 },
      taskFor: [],
      tags: [],
      location: ''
    };
    const updatedSteps = [...form.recipeProcess.steps];
    updatedSteps[stepIndex].tasks.push(newTask);
    setForm({
      ...form,
      recipeProcess: {
        ...form.recipeProcess,
        steps: updatedSteps
      }
    });
  };

  const removeTask = (stepIndex: number, taskIndex: number) => {
    const updatedSteps = [...form.recipeProcess.steps];
    updatedSteps[stepIndex].tasks = updatedSteps[stepIndex].tasks.filter((_, i) => i !== taskIndex);
    setForm({
      ...form,
      recipeProcess: {
        ...form.recipeProcess,
        steps: updatedSteps
      }
    });
  };

  const updateTask = (stepIndex: number, taskIndex: number, field: keyof StepTaskTemplate, value: any) => {
    const updatedSteps = [...form.recipeProcess.steps];
    updatedSteps[stepIndex].tasks[taskIndex] = { ...updatedSteps[stepIndex].tasks[taskIndex], [field]: value };
    setForm({
      ...form,
      recipeProcess: {
        ...form.recipeProcess,
        steps: updatedSteps
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Calculate total time if not provided
      const totalTime = form.totalTimeMin || (form.prepTimeMin + form.cookTimeMin);

      const recipeData = {
        ...form,
        totalTimeMin: totalTime
      };

      const response = await api.post('/recipes', recipeData);
      if (response.ok) {
        toast.success('Recipe created successfully');
        router.push('/admin/recipes');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create recipe');
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast.error('Failed to create recipe');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdminOrEmployee) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/recipes')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Recipes
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Recipe</h1>
          <p className="text-gray-600 mt-2">
            Create a new recipe with ingredients and cooking process
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Recipe details and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Recipe Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter recipe name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appetizer">Appetizer</SelectItem>
                      <SelectItem value="main-course">Main Course</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the recipe..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="serves">Serves *</Label>
                  <Input
                    id="serves"
                    type="number"
                    min="1"
                    value={form.serves}
                    onChange={(e) => setForm({ ...form, serves: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prepTime">Prep Time (min)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    min="0"
                    value={form.prepTimeMin}
                    onChange={(e) => setForm({ ...form, prepTimeMin: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="cookTime">Cook Time (min)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    min="0"
                    value={form.cookTimeMin}
                    onChange={(e) => setForm({ ...form, cookTimeMin: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="totalTime">Total Time (min)</Label>
                  <Input
                    id="totalTime"
                    type="number"
                    min="0"
                    value={form.totalTimeMin}
                    onChange={(e) => setForm({ ...form, totalTimeMin: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setForm({ ...form, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cuisine">Cuisine</Label>
                  <Input
                    id="cuisine"
                    value={form.cuisine}
                    onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                    placeholder="e.g., Indian, Italian, Chinese"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ingredients</CardTitle>
                  <CardDescription>Raw materials and quantities needed</CardDescription>
                </div>
                <Button type="button" onClick={addIngredient} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.ingredients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No ingredients added yet.</p>
                  <p className="text-sm">Click "Add Ingredient" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Raw Material *</Label>
                          <Select
                            value={typeof ingredient.rawMaterial === 'string' ? ingredient.rawMaterial : ingredient.rawMaterial?._id || ''}
                            onValueChange={(value) => updateIngredient(index, 'rawMaterial', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {rawMaterials.map((material) => (
                                <SelectItem key={material._id} value={material._id}>
                                  {material.name} ({material.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label>Unit *</Label>
                          <Input
                            value={ingredient.unit}
                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            placeholder="kg, g, pieces, etc."
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            value={ingredient.notes || ''}
                            onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                            placeholder="e.g., finely chopped"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipe Process */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recipe Process</CardTitle>
                  <CardDescription>Cooking steps and tasks</CardDescription>
                </div>
                <Button type="button" onClick={addStep} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="processName">Process Name *</Label>
                  <Input
                    id="processName"
                    value={form.recipeProcess.name}
                    onChange={(e) => setForm({
                      ...form,
                      recipeProcess: { ...form.recipeProcess, name: e.target.value }
                    })}
                    placeholder="e.g., Basic Cooking Process"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="processDescription">Process Description</Label>
                  <Textarea
                    id="processDescription"
                    value={form.recipeProcess.description}
                    onChange={(e) => setForm({
                      ...form,
                      recipeProcess: { ...form.recipeProcess, description: e.target.value }
                    })}
                    placeholder="Describe the overall cooking process..."
                    rows={2}
                  />
                </div>
              </div>

              {form.recipeProcess.steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No steps added yet.</p>
                  <p className="text-sm">Click "Add Step" to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {form.recipeProcess.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Step {stepIndex + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(stepIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Step Name *</Label>
                            <Input
                              value={step.name}
                              onChange={(e) => updateStep(stepIndex, 'name', e.target.value)}
                              placeholder="e.g., Prepare ingredients"
                              required
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={step.location || ''}
                              onChange={(e) => updateStep(stepIndex, 'location', e.target.value)}
                              placeholder="e.g., Kitchen, Prep area"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Instructions</Label>
                          <Textarea
                            value={step.instructions || ''}
                            onChange={(e) => updateStep(stepIndex, 'instructions', e.target.value)}
                            placeholder="Detailed instructions for this step..."
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Order</Label>
                            <Input
                              type="number"
                              min="0"
                              value={step.order}
                              onChange={(e) => updateStep(stepIndex, 'order', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>Duration (minutes)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={step.estimatedDurationMin || 0}
                              onChange={(e) => updateStep(stepIndex, 'estimatedDurationMin', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        {/* Tasks for this step */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Tasks</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addTask(stepIndex)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Task
                            </Button>
                          </div>

                          {step.tasks.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No tasks added for this step.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {step.tasks.map((task, taskIndex) => (
                                <div key={taskIndex} className="border rounded p-3 bg-gray-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Task {taskIndex + 1}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTask(stepIndex, taskIndex)}
                                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">Task Name</Label>
                                      <Input
                                        size="sm"
                                        value={task.name}
                                        onChange={(e) => updateTask(stepIndex, taskIndex, 'name', e.target.value)}
                                        placeholder="Task name"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Type</Label>
                                      <Select
                                        value={task.type}
                                        onValueChange={(value: TaskType) => updateTask(stepIndex, taskIndex, 'type', value)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="cooking">Cooking</SelectItem>
                                          <SelectItem value="cutting">Cutting</SelectItem>
                                          <SelectItem value="preparing">Preparing</SelectItem>
                                          <SelectItem value="cleaning">Cleaning</SelectItem>
                                          <SelectItem value="mixing">Mixing</SelectItem>
                                          <SelectItem value="removing">Removing</SelectItem>
                                          <SelectItem value="soaking">Soaking</SelectItem>
                                          <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Priority</Label>
                                      <Select
                                        value={task.priority}
                                        onValueChange={(value: TaskPriority) => updateTask(stepIndex, taskIndex, 'priority', value)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="low">Low</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="high">High</SelectItem>
                                          <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Duration (min)</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={task.timeWindow.durationMin}
                                        onChange={(e) => updateTask(stepIndex, taskIndex, 'timeWindow', {
                                          ...task.timeWindow,
                                          durationMin: parseInt(e.target.value) || 5
                                        })}
                                        className="h-8"
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-2">
                                    <Label className="text-xs">Description</Label>
                                    <Textarea
                                      value={task.description || ''}
                                      onChange={(e) => updateTask(stepIndex, taskIndex, 'description', e.target.value)}
                                      placeholder="Task description..."
                                      rows={2}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/recipes')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Recipe
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
