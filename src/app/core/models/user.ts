/** Possible user roles within the system */
export type Role = 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';
/** Possible registration and account statuses */
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status?: UserStatus;
  profileImageUrl?: string | null; // URL de la imagen de perfil en Cloudinary
  gender?: string;
  birthDate?: string;
  height?: number;
  currentWeight?: number;
  medicalNotes?: string;
  createdAt?: string;
  centerId?: string; // Centro actual donde está físicamente (solo se actualiza desde QR scanner)
  favoriteCenterId?: string | null; // Centro favorito/asignado (se puede cambiar desde CRUD)
  center?: {
    id: string;
    name: string;
  };
  favoriteCenter?: {
    id: string;
    name: string;
  };
}