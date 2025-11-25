export interface Center {
  id?: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCenterInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface UpdateCenterInput {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}

