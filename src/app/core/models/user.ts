/** Possible user roles within the system */
export type Role = 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';
/** Possible registration and account statuses */
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

/**
 * Represents a user within the system.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** Full name of the user */
  name: string;
  /** Email address of the user */
  email: string;
  /** Role assigned to the user */
  role: Role;
  /** Current account status */
  status?: UserStatus;
  /** URL to the profile image, typically stored in Cloudinary */
  profileImageUrl?: string | null;
  /** Gender of the user */
  gender?: string;
  /** Birth date of the user */
  birthDate?: string;
  /** Height in centimeters */
  height?: number;
  /** Current weight in kilograms */
  currentWeight?: number;
  /** Physical activity level (e.g., sedentary, active) */
  activityLevel?: string;
  /** Short-term or long-term fitness goal */
  goal?: string;
  /** Relevant medical notes or conditions */
  medicalNotes?: string;
  /** ISO date string of when the user was created */
  createdAt?: string;
  /** ID of the center where the user is currently located (updated via QR) */
  centerId?: string;
  /** ID of the user's favorite or assigned center */
  favoriteCenterId?: string | null;
  /** Basic information about the current center */
  center?: {
    id: string;
    name: string;
  };
  /** Basic information about the favorite center */
  favoriteCenter?: {
    id: string;
    name: string;
  };
}