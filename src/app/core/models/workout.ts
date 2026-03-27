import { Exercise } from './exercise';

/**
 * Represents an exercise entry within a workout routine.
 */
/**
 * Represents an exercise entry within a workout routine.
 */
export interface WorkoutExercise {
  /** Unique identifier for the workout exercise entry */
  id: string;
  /** ID of the workout routine it belongs to */
  workoutId: string;
  /** ID of the specific exercise */
  exerciseId: string;
  /** Detailed exercise information */
  exercise: Exercise;
  /** Day of the week: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday */
  dayOfWeek: number;
  /** Execution order within the day */
  order: number;
  /** Number of sets to perform */
  sets?: number | null;
  /** Number of repetitions per set */
  reps?: number | null;
  /** Weight to use (kg) */
  weight?: number | null;
  /** Duration in seconds */
  duration?: number | null;
  /** Resting time between sets in seconds */
  restSeconds?: number | null;
  /** Additional notes for the exercise */
  notes?: string | null;
  /** ISO date string of creation */
  createdAt: string;
  /** ISO date string of last update */
  updatedAt: string;
}

/**
 * Represents a user's workout routine containing multiple exercises.
 */
export interface Workout {
  /** Unique identifier for the workout */
  id: string;
  /** ID of the user who owns the workout */
  userId: string;
  /** Brief user information */
  user: {
    id: string;
    name: string;
    email: string;
  };
  /** Name of the workout routine */
  name: string;
  /** Optional description of the routine */
  description?: string | null;
  /** List of exercises included in the routine */
  exercises: WorkoutExercise[];
  /** ISO date string of creation */
  createdAt: string;
  /** ISO date string of last update */
  updatedAt: string;
}

/**
 * Data needed to create a new workout routine.
 */
export interface CreateWorkoutInput {
  /** Name of the new workout */
  name: string;
  /** Optional description */
  description?: string;
}

/**
 * Data needed to update an existing workout routine.
 */
export interface UpdateWorkoutInput {
  /** Updated name */
  name?: string;
  /** Updated description */
  description?: string;
}

/**
 * Data needed to add an exercise to a workout routine.
 */
export interface AddExerciseToWorkoutInput {
  /** ID of the exercise to add */
  exerciseId: string;
  /** Assigned day of the week (0-6) */
  dayOfWeek: number;
  /** Order in the list for that day */
  order: number;
  /** Target number of sets */
  sets?: number;
  /** Target number of repetitions */
  reps?: number;
  /** Target weight in kg */
  weight?: number;
  /** Target duration in seconds */
  duration?: number;
  /** Target rest time in seconds */
  restSeconds?: number;
  /** Optional notes */
  notes?: string;
}

/**
 * Data needed to update an exercise entry within a workout.
 */
export interface UpdateWorkoutExerciseInput {
  /** Updated day of the week */
  dayOfWeek?: number;
  /** Updated order */
  order?: number;
  /** Updated number of sets */
  sets?: number | null;
  /** Updated number of repetitions */
  reps?: number | null;
  /** Updated weight */
  weight?: number | null;
  /** Updated duration */
  duration?: number | null;
  /** Updated rest time */
  restSeconds?: number | null;
  /** Updated notes */
  notes?: string | null;
}

/**
 * Data needed to reorder multiple exercises within workouts.
 */
export interface ReorderWorkoutExercisesInput {
  /** List of updated positions for exercises */
  exercises: Array<{
    /** ID of the workout exercise entry */
    id: string;
    /** New day of the week */
    dayOfWeek: number;
    /** New order */
    order: number;
  }>;
}


