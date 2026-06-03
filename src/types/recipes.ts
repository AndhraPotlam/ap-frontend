import { StepTaskTemplate } from './tasks';

export interface RawMaterial {
  _id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  costPerUnit: number;
  supplier?: string;
  minimumStock: number;
  currentStock: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  _id?: string;
  rawMaterial: string | RawMaterial;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface RecipeStep {
  _id?: string;
  name: string;
  order: number;
  instructions?: string;
  location?: string;
  estimatedDurationMin?: number;
  tasks: StepTaskTemplate[];
}

export interface RecipeProcess {
  _id?: string;
  name: string;
  description?: string;
  steps: RecipeStep[];
}

export interface Recipe {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  serves: number;
  prepTimeMin?: number;
  cookTimeMin?: number;
  totalTimeMin?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  ingredients: RecipeIngredient[];
  recipeProcess: RecipeProcess;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyRecipeProcess {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  steps: RecipeStep[];
  createdBy?: string;
}

export interface DayPlanSelectedRecipe {
  recipe: string | RecipeProcess;
  plannedStart?: string; // HH:mm
}

export interface DayPlan {
  _id: string;
  date: string; // ISO
  shift?: 'morning' | 'evening' | 'other';
  selectedRecipes: DayPlanSelectedRecipe[];
  generatedAt?: string;
  generatedBy?: string;
}
