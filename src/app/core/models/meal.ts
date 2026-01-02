export interface Meal {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  imageUrl?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  fiber?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealInput {
  name: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
}

export interface UpdateMealInput {
  name?: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  fiber?: number | null;
}

