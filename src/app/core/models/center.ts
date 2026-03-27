/**
 * Represents a gym training center.
 */
/**
 * Represents a gym training center.
 */
export interface Center {
  /** Unique identifier for the center */
  id?: string;
  /** Display name of the center */
  name: string;
  /** Detailed description of the center facilities */
  description?: string;
  /** Physical street address */
  address?: string;
  /** City where the center is located */
  city?: string;
  /** Country of the center */
  country?: string;
  /** Contact phone number */
  phone?: string;
  /** Contact email address */
  email?: string;
  /** ISO date string of creation */
  createdAt?: string;
  /** ISO date string of last update */
  updatedAt?: string;
}

/**
 * Input for creating a new center.
 */
export interface CreateCenterInput {
  /** Center name */
  name: string;
  /** Center description */
  description?: string;
  /** Street address */
  address?: string;
  /** City */
  city?: string;
  /** Country */
  country?: string;
  /** Phone number */
  phone?: string;
  /** Email address */
  email?: string;
}

/**
 * Input for updating an existing center.
 */
export interface UpdateCenterInput {
  /** Updated name */
  name?: string;
  /** Updated description */
  description?: string;
  /** Updated address */
  address?: string;
  /** Updated city */
  city?: string;
  /** Updated country */
  country?: string;
  /** Updated phone number */
  phone?: string;
  /** Updated email address */
  email?: string;
}


