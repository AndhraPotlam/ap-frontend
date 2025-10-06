'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calculator, DollarSign, Users, Package, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Recipe, RecipeIngredient } from '@/types';
import { toast } from 'sonner';

interface CostCalculation {
  recipe: string;
  originalServings: number;
  targetServings: number;
  totalCost: number;
  costPerServing: number;
  totalCostForServings: number;
  ingredientCosts: Array<{
    ingredient: RecipeIngredient;
    cost: number;
  }>;
}

export default function RecipeCostPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin, user: authUser } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [costCalculation, setCostCalculation] = useState<CostCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [targetServings, setTargetServings] = useState(1);

  const isAdminOrEmployee = isAdmin || authUser?.role === 'employee';
  const recipeId = params.id as string;

  useEffect(() => {
    if (!isAdminOrEmployee) {
      router.push('/dashboard');
      return;
    }
    if (recipeId) {
      fetchRecipe();
    }
  }, [isAdminOrEmployee, router, recipeId]);

  const fetchRecipe = async () => {
    try {
      const response = await api.get(`/recipes/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
        setTargetServings(data.recipe.serves || 1);
        // Auto-calculate cost on load
        calculateCost(data.recipe.serves || 1);
      } else {
        toast.error('Failed to load recipe');
        router.push('/admin/recipes');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = async (servings: number) => {
    if (!recipeId) return;
    
    setCalculating(true);
    try {
      const response = await api.get(`/recipes/${recipeId}/cost?servings=${servings}`);
      if (response.ok) {
        const data = await response.json();
        setCostCalculation(data);
      } else {
        toast.error('Failed to calculate recipe cost');
      }
    } catch (error) {
      console.error('Error calculating cost:', error);
      toast.error('Failed to calculate recipe cost');
    } finally {
      setCalculating(false);
    }
  };

  const handleServingsChange = (servings: number) => {
    setTargetServings(servings);
    calculateCost(servings);
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

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recipe not found</h3>
              <p className="text-gray-600 mb-4">
                The recipe you're looking for doesn't exist or has been deleted.
              </p>
              <Button onClick={() => router.push('/admin/recipes')}>
                Back to Recipes
              </Button>
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold text-gray-900">Recipe Cost Calculator</h1>
          <p className="text-gray-600 mt-2">
            Calculate the cost of "{recipe.name}" for different serving sizes
          </p>
        </div>

        {/* Recipe Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recipe Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Original Servings:</span>
                <span className="font-medium">{recipe.serves}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Difficulty:</span>
                <Badge className="ml-1">
                  {recipe.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Ingredients:</span>
                <span className="font-medium">{recipe.ingredients?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Calculator */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cost Calculator
            </CardTitle>
            <CardDescription>
              Enter the number of servings to calculate the total cost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="servings">Number of Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  value={targetServings}
                  onChange={(e) => handleServingsChange(parseInt(e.target.value) || 1)}
                  className="w-32"
                />
              </div>
              {calculating && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Calculating...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost Results */}
        {costCalculation && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-blue-600 mr-4" />
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Cost</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ${costCalculation.totalCostForServings.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600 mr-4" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Cost per Serving</p>
                      <p className="text-2xl font-bold text-green-900">
                        ${costCalculation.costPerServing.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-purple-600 mr-4" />
                    <div>
                      <p className="text-sm font-medium text-purple-600">Original Recipe Cost</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ${costCalculation.totalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Ingredient Cost Breakdown</CardTitle>
                <CardDescription>
                  Detailed cost breakdown for {targetServings} serving{targetServings !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costCalculation.ingredientCosts.map((item, index) => {
                    const ingredient = item.ingredient;
                    const rawMaterial = typeof ingredient.rawMaterial === 'string' 
                      ? null 
                      : ingredient.rawMaterial;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {rawMaterial?.name || 'Unknown Material'}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {ingredient.quantity} {ingredient.unit}
                            </Badge>
                          </div>
                          {ingredient.notes && (
                            <p className="text-sm text-gray-600 mt-1">{ingredient.notes}</p>
                          )}
                          {rawMaterial && (
                            <p className="text-xs text-gray-500 mt-1">
                              Cost: ${rawMaterial.costPerUnit.toFixed(2)} per {rawMaterial.unit}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            ${item.cost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Total Cost for {targetServings} serving{targetServings !== 1 ? 's' : ''}:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${costCalculation.totalCostForServings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Cost Data */}
        {!costCalculation && !calculating && (
          <Card>
            <CardContent className="text-center py-12">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Cost Data Available</h3>
              <p className="text-gray-600 mb-4">
                Unable to calculate cost. This might be because some ingredients don't have cost information.
              </p>
              <Button onClick={() => router.push(`/admin/recipes/edit/${recipeId}`)}>
                Edit Recipe
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

