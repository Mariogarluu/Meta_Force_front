export interface Exercise {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  machineTypeId?: string | null;
  machineType?: {
    id: string;
    name: string;
    type: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExerciseInput {
  name: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  videoUrl?: string;
  machineTypeId?: string;
}

export interface UpdateExerciseInput {
  name?: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  videoUrl?: string;
  machineTypeId?: string | null;
}

