'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Search, ChefHat, Package, Tag, Clock, Users, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import { Recipe } from '@/types';

export default function RecipesPage() {
  const router = useRouter();
  const { user, isAdmin, user: authUser } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');

  const isAdminOrEmployee = isAdmin || authUser?.role === 'employee';

  useEffect(() => {
    if (!isAdminOrEmployee) {
      router.push('/dashboard');
      return;
    }
    fetchRecipes();
  }, [isAdminOrEmployee, router]);

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
      if (difficultyFilter && difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
      if (cuisineFilter && cuisineFilter !== 'all') params.append('cuisine', cuisineFilter);

      const response = await api.get(`/recipes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [searchTerm, categoryFilter, difficultyFilter, cuisineFilter]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!isAdminOrEmployee) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Recipe Management</h1>
          <p className="text-gray-600 mt-2">
            Manage recipes, ingredients, and cooking processes
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/recipes')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <ChefHat className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">Recipes</CardTitle>
                <CardDescription>Manage recipes and cooking processes</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create, edit, and organize recipes with ingredients and cooking steps.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/raw-materials')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">Raw Materials</CardTitle>
                <CardDescription>Manage ingredients and supplies</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track ingredients, manage inventory, and monitor costs.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/products')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Tag className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <CardTitle className="text-lg">Product Management</CardTitle>
                <CardDescription>Manage products and categories</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Manage menu items, categories, and product catalog.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="appetizer">Appetizer</SelectItem>
                <SelectItem value="main-course">Main Course</SelectItem>
                <SelectItem value="dessert">Dessert</SelectItem>
                <SelectItem value="beverage">Beverage</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cuisines</SelectItem>
                <SelectItem value="indian">Indian</SelectItem>
                <SelectItem value="italian">Italian</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="mexican">Mexican</SelectItem>
                <SelectItem value="american">American</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => router.push('/admin/recipes/add')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Recipe
          </Button>
        </div>

        {/* Recipes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter || difficultyFilter || cuisineFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first recipe.'}
              </p>
              <Button onClick={() => router.push('/admin/recipes/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{recipe.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {recipe.description || 'No description available'}
                      </CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(recipe.difficulty)}>
                      {recipe.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {recipe.serves || 1} serves
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(recipe.totalTimeMin)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Ingredients:</span>
                      <span className="font-medium">{recipe.ingredients?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Steps:</span>
                      <span className="font-medium">{recipe.recipeProcess?.steps?.length || 0}</span>
                    </div>

                    {recipe.cuisine && (
                      <Badge variant="outline" className="text-xs">
                        {recipe.cuisine}
                      </Badge>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/admin/recipes/edit/${recipe._id}`)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/admin/recipes/cost/${recipe._id}`)}
                        className="flex-1"
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Cost
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
