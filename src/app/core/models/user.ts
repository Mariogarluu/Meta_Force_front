export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';
  createdAt?: string;
  centerId?: string;
  center?: {
    id: string;
    name: string;
  };
}