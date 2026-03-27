/**
 * Schedule for a gym class in a specific center.
 */
/**
 * Schedule for a gym class in a specific center.
 */
export interface ClassCenterSchedule {
  /** Unique identifier for the schedule entry */
  id: string;
  /** ID of the associated gym class */
  classId: string;
  /** ID of the center where the class takes place */
  centerId: string;
  /** Day of the week: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday */
  dayOfWeek: number;
  /** Start time in HH:mm format (e.g., "09:00") */
  startTime: string;
  /** End time in HH:mm format (e.g., "10:30") */
  endTime: string;
  /** Basic center information */
  center?: {
    id: string;
    name: string;
  };
  /** ISO date string of creation */
  createdAt?: string;
  /** ISO date string of last update */
  updatedAt?: string;
}

/**
 * Association between a gym class and a trainer.
 */
export interface ClassTrainer {
  /** Unique identifier for the association */
  id: string;
  /** ID of the gym class */
  classId: string;
  /** ID of the trainer assigned */
  trainerId: string;
  /** Basic trainer profile information */
  trainer?: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  };
  /** ISO date string of when the trainer was assigned */
  createdAt?: string;
}

/**
 * Represents a gym class (e.g., Yoga, HIIT).
 */
export interface GymClass {
  /** Unique identifier for the gym class */
  id: string;
  /** Name of the class */
  name: string;
  /** Optional description of the class activities */
  description?: string | null;
  /** ISO date string of creation */
  createdAt?: string;
  /** ISO date string of last update */
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

/**
 * Data needed to create a new gym class.
 */
export interface CreateClassInput {
  /** Class name */
  name: string;
  /** Optional description */
  description?: string;
}

/**
 * Data needed to add a center and its schedules to a class.
 */
export interface AddCenterToClassInput {
  /** Target center ID */
  centerId: string;
  /** List of trainer IDs assigned to this center for this class */
  trainerIds: string[];
  /** List of time slots for the class at this center */
  schedules: Array<{
    /** Assigned day of the week (0-6) */
    dayOfWeek: number;
    /** Start time in HH:mm */
    startTime: string;
    /** End time in HH:mm */
    endTime: string;
  }>;
}

/**
 * Data needed to update an existing gym class and its associations.
 */
export interface UpdateClassInput {
  /** Updated name */
  name?: string;
  /** Updated description */
  description?: string;
  /** Updated list of assigned trainers */
  trainerIds?: string[];
  /** Updated list of schedules */
  schedules?: Array<{
    /** Schedule ID if updating, omitted if creating new */
    id?: string;
    /** Associated center ID */
    centerId: string;
    /** Day of the week */
    dayOfWeek: number;
    /** Start time */
    startTime: string;
    /** End time */
    endTime: string;
  }>;
}



