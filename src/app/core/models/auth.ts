export interface AuthInput {
  email: string;
  password?: string;
}

export interface RegisterInput extends AuthInput {
  name: string;
  role?: 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';
    createdAt?: string;
  };
}