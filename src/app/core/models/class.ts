/**
 * Schedule for a gym class in a specific center.
 */
export interface ClassCenterSchedule {
  id: string;
  classId: string;
  centerId: string;
  /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  dayOfWeek: number;
  /** Start time in HH:mm format (e.g., "09:00") */
  startTime: string;
  /** End time in HH:mm format (e.g., "10:30") */
  endTime: string;
  center?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Association between a gym class and a trainer.
 */
export interface ClassTrainer {
  id: string;
  classId: string;
  trainerId: string;
  trainer?: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  };
  createdAt?: string;
}

/**
 * Represents a gym class (e.g., Yoga, HIIT).
 */
export interface GymClass {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Trainers who teach this class */
  trainers?: ClassTrainer[];
  /** Schedules for this class in different centers */
  schedules?: ClassCenterSchedule[];
  /** Centers where the class is taught (derived from schedules) */
  centers?: Array<{
    id: string;
    name: string;
  }>;
}

export interface CreateClassInput {
  name: string;
  description?: string;
}

export interface AddCenterToClassInput {
  centerId: string;
  trainerIds: string[]; // IDs de los entrenadores (mínimo 1)
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>; // Mínimo 1 horario
}

export interface UpdateClassInput {
  name?: string;
  description?: string;
  trainerIds?: string[];
  schedules?: Array<{
    id?: string; // Si existe, actualizar; si no, crear nuevo
    centerId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}


