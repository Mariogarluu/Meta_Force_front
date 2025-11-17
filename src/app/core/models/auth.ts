export interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    surname: string;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface AuthInput {
    email: string;
    password?: string;
  }
  
  export interface RegisterInput extends AuthInput {
    name: string;
    surname: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: User;
  }