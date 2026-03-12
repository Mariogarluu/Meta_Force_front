import { Meal } from './meal';

/**
 * Represents a specific meal within a dietary plan.
 */
export interface DietMeal {
  id: string;
  dietId: string;
  mealId: string;
  meal: Meal;
  /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  dayOfWeek: number;
  mealType: 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';
  order: number;
  quantity?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a user's dietary plan containing multiple meals.
 */
export interface Diet {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  name: string;
  description?: string | null;
  meals: DietMeal[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDietInput {
  name: string;
  description?: string;
}

export interface UpdateDietInput {
  name?: string;
  description?: string;
}

export interface AddMealToDietInput {
  mealId: string;
  dayOfWeek: number;
  mealType: 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';
  order: number;
  quantity?: number;
  notes?: string;
}

export interface UpdateDietMealInput {
  dayOfWeek?: number;
  mealType?: 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';
  order?: number;
  quantity?: number | null;
  notes?: string | null;
}

export interface ReorderDietMealsInput {
  meals: Array<{
    id: string;
    dayOfWeek: number;
    mealType: 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';
    order: number;
  }>;
}

