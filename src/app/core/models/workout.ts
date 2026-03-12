import { Exercise } from './exercise';

/**
 * Represents an exercise entry within a workout routine.
 */
export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  dayOfWeek: number;
  order: number;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  /** Duration in seconds */
  duration?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a user's workout routine containing multiple exercises.
 */
export interface Workout {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  name: string;
  description?: string | null;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkoutInput {
  name: string;
  description?: string;
}

export interface UpdateWorkoutInput {
  name?: string;
  description?: string;
}

export interface AddExerciseToWorkoutInput {
  exerciseId: string;
  dayOfWeek: number;
  order: number;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restSeconds?: number;
  notes?: string;
}

export interface UpdateWorkoutExerciseInput {
  dayOfWeek?: number;
  order?: number;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
}

export interface ReorderWorkoutExercisesInput {
  exercises: Array<{
    id: string;
    dayOfWeek: number;
    order: number;
  }>;
}

