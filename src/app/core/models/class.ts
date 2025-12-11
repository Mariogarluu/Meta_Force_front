export interface ClassCenterSchedule {
  id: string;
  classId: string;
  centerId: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startTime: string; // Formato HH:mm (ej: "09:00")
  endTime: string; // Formato HH:mm (ej: "10:30")
  center?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

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

export interface GymClass {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Entrenadores que enseñan la clase
  trainers?: ClassTrainer[];
  // Horarios de la clase en diferentes centros
  schedules?: ClassCenterSchedule[];
  // Centros donde se imparte la clase (derivado de schedules)
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


