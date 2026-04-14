/**
 * Represents a specific physical exercise.
 */
/**
 * Represents a specific physical exercise.
 */
export interface Exercise {
  /** Unique identifier for the exercise */
  id: string;
  /** Name of the exercise */
  name: string;
  /** Detailed description of the exercise */
  description?: string | null;
  /** Step-by-step performance instructions */
  instructions?: string | null;
  /** URL to an illustrative image */
  imageUrl?: string | null;
  /** URL to a demonstration video */
  videoUrl?: string | null;
  /** ID of the recommended machine type to use */
  machineTypeId?: string | null;
  /** Basic machine type information */
  machineType?: {
    id: string;
    name: string;
    type: string;
  } | null;
  /** ISO date string of creation */
  createdAt: string;
  /** ISO date string of last update */
  updatedAt: string;
}

/**
 * Data needed to create a new exercise.
 */
export interface CreateExerciseInput {
  /** Exercise name */
  name: string;
  /** Exercise description */
  description?: string;
  /** Performance instructions */
  instructions?: string;
  /** Optional image URL */
  imageUrl?: string;
  /** Optional video URL */
  videoUrl?: string;
  /** Associated machine type ID */
  machineTypeId?: string;
}

/**
 * Data needed to update an existing exercise.
 */
export interface UpdateExerciseInput {
  /** Updated name */
  name?: string;
  /** Updated description */
  description?: string;
  /** Updated instructions */
  instructions?: string;
  /** Updated image URL */
  imageUrl?: string;
  /** Updated video URL */
  videoUrl?: string;
  /** Updated associated machine type ID */
  machineTypeId?: string | null;
}


