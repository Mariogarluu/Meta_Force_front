import type { Role, UserStatus } from './user';

/**
 * Input for standard authentication (login).
 */
/**
 * Input for standard authentication (login).
 */
export interface AuthInput {
  /** User's email address */
  email: string;
  /** User's password */
  password?: string;
}

/**
 * Input for user registration, extending standard authentication.
 */
export interface RegisterInput extends AuthInput {
  /** User's full name */
  name: string;
  /** Desired role for the new user */
  role?: Role;
}

/**
 * Successful authentication response containing JWT and user data.
 */
export interface AuthResponse {
  /** JSON Web Token for authenticated requests */
  token: string;
  /** Basic user information included in the token response */
  user: {
    /** Unique identifier for the user */
    id: string;
    /** User's email */
    email: string;
    /** User's full name */
    name: string;
    /** User's assigned role */
    role: Role;
    /** User's current account status */
    status?: UserStatus;
    /** ISO date string of creation */
    createdAt?: string;
    /** ID of the center the user is currently checked into */
    centerId?: string;
  };
}