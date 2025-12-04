export interface GymClass {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassInput {
  name: string;
  description?: string;
}

export interface UpdateClassInput {
  name?: string;
  description?: string;
}


