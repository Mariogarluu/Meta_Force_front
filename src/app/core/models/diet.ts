import { Meal } from './meal';

/**
 * Represents a specific meal within a dietary plan.
 */
/**
 * Represents a specific meal within a dietary plan.
 */
export interface DietMeal {
  /** Unique identifier for the diet meal entry */
  id: string;
  /** ID of the dietary plan it belongs to */
  dietId: string;
  /** ID of the specific meal */
  mealId: string;
  /** Detailed meal information */
  meal: Meal;
  /** Day of the week: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday */
  dayOfWeek: number;
  /** Type of meal (e.g., breakfast, lunch) */
  mealType: 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';
  /** Execution order within the day */
  order: number;
  /** Amount or portions */
  quantity?: number | null;
  /** Additional dietary notes */
  notes?: string | null;
  /** ISO date string of creation */
  createdAt: string;
  /** ISO date string of last update */
  updatedAt: string;
}

/**
 * Represents a user's dietary plan containing multiple meals.
 */
export interface Diet {
  /** Unique identifier for the diet plan */
  id: string;
  /** ID of the user who owns the diet */
  userId: string;
  /** Brief user information */
  user: {
    id: string;
    name: string;
    email: string;
  };
  /** Name of the dietary plan */
  name: string;
  /** Optional description of the plan */
  description?: string | null;
  /** List of meals included in the plan */
  meals: DietMeal[];
  /** ISO date string of creation */
  createdAt: string;
  /** ISO date string of last update */
  updatedAt: string;
}

/**
 * Data needed to create a new dietary plan.
 */
export interface CreateDietInput {
  /** Plan name */
  name: string;
  /** Optional description */
  description?: string;
}

/**
 * Data needed to update an existing dietary plan.
 */
export interface UpdateDietInput {
  /** Updated name */
  name?: string;
  /** Updated description */
  description?: string;
}

/**
 * Data needed to add a meal to a dietary plan.
 */
export interface AddMealToDietInput {
  /** ID of the meal to add */
  mealId: string;
  /** Assigned day of the week (0-6) */
  dayOfWeek: number;
  /** Category of the meal */
  mealType: 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';
  /** Order in the list for that day */
  order: number;
  /** Portion size or quantity */
  quantity?: number;
  /** Optional notes */
  notes?: string;
}

/**
 * Data needed to update a meal entry within a diet.
 */
export interface UpdateDietMealInput {
  /** Updated day of the week */
  dayOfWeek?: number;
  /** Updated meal category */
  mealType?: 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';
  /** Updated order */
  order?: number;
  /** Updated quantity */
  quantity?: number | null;
  /** Updated notes */
  notes?: string | null;
}

/**
 * Data needed to reorder multiple meals within dietary plans.
 */
export interface ReorderDietMealsInput {
  /** List of updated positions for meals */
  meals: Array<{
    /** ID of the diet meal entry */
    id: string;
    /** New day of the week */
    dayOfWeek: number;
    /** New meal category */
    mealType: 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';
    /** New order */
    order: number;
  }>;
}


