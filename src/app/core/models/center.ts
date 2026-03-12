/**
 * Represents a gym training center.
 */
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

/**
 * Input for creating a new center.
 */
export interface CreateCenterInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}

/**
 * Input for updating an existing center.
 */
export interface UpdateCenterInput {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}

