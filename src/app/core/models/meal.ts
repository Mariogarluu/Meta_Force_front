/**
 * Represents a meal with nutritional information.
 */
/**
 * Represents a meal with nutritional information.
 */
export interface Meal {
  /** Unique identifier for the meal */
  id: string;
  /** Name of the meal */
  name: string;
  /** Short description of the meal */
  description?: string | null;
  /** Cooking or preparation instructions */
  instructions?: string | null;
  /** URL to the meal's image */
  imageUrl?: string | null;
  /** Total calories in the meal */
  calories?: number | null;
  /** Protein content in grams */
  protein?: number | null;
  /** Carbohydrate content in grams */
  carbs?: number | null;
  /** Fat content in grams */
  fats?: number | null;
  /** Fiber content in grams */
  fiber?: number | null;
  /** ISO date string of creation */
  createdAt: string;
  /** ISO date string of last update */
  updatedAt: string;
}

/**
 * Data needed to create a new meal.
 */
export interface CreateMealInput {
  /** Meal name */
  name: string;
  /** Optional description */
  description?: string;
  /** Optional instructions */
  instructions?: string;
  /** Optional image URL */
  imageUrl?: string;
  /** Nutritional info: Calories */
  calories?: number;
  /** Nutritional info: Protein (g) */
  protein?: number;
  /** Nutritional info: Carbs (g) */
  carbs?: number;
  /** Nutritional info: Fats (g) */
  fats?: number;
  /** Nutritional info: Fiber (g) */
  fiber?: number;
}

/**
 * Data needed to update an existing meal.
 */
export interface UpdateMealInput {
  /** Updated name */
  name?: string;
  /** Updated description */
  description?: string;
  /** Updated instructions */
  instructions?: string;
  /** Updated image URL */
  imageUrl?: string;
  /** Updated calories */
  calories?: number | null;
  /** Updated protein */
  protein?: number | null;
  /** Updated carbs */
  carbs?: number | null;
  /** Updated fats */
  fats?: number | null;
  /** Updated fiber */
  fiber?: number | null;
}


