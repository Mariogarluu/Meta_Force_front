import type { Role, UserStatus } from './user';

/**
 * Input for standard authentication (login).
 */
export interface AuthInput {
  email: string;
  password?: string;
}

/**
 * Input for user registration, extending standard authentication.
 */
export interface RegisterInput extends AuthInput {
  name: string;
  role?: Role;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    status?: UserStatus;
    createdAt?: string;
    centerId?: string;
  };
}