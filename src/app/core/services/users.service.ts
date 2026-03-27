import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Role, UserStatus } from '../models/user';

/**
 * Data needed to update a user's information.
 */
export interface UpdateUserInput {
  /** Updated full name */
  name?: string;
  /** Updated email address */
  email?: string;
  /** Updated role (Admin only) */
  role?: Role;
  /** Updated account status (Admin only) */
  status?: UserStatus;
  /** Updated favorite center ID (User/Admin) */
  favoriteCenterId?: string | null;
}

/**
 * Service for managing user-related data and profile operations.
 * Handles user listing, profile updates, and image management.
 */
@Injectable({
  providedIn: 'root'
})
export class UsersService {
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for user operations */
  private apiUrl = `${environment.apiUrl}/users`;

  /**
   * Lists all users visible to the authenticated user.
   * SUPERADMIN sees all, ADMIN_CENTER only users from their center.
   * @returns Observable emitting an array of users
   */
  listUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  /**
   * Lists all active trainers.
   * Accessible to all authenticated users.
   * @param centerId - Optional: filter trainers by favorite center
   * @returns Observable emitting an array of trainers
   */
  listTrainers(centerId?: string | null): Observable<User[]> {
    const params: any = {};
    if (centerId) {
      params.centerId = centerId;
    }
    return this.http.get<User[]>(`${this.apiUrl}/trainers`, { params });
  }

  /**
   * Updates data for a specific user identified by ID.
   * Allows modifying name, email, role, status, and center based on permissions.
   * @param id - User ID to update
   * @param data - Updated user data
   * @returns Observable emitting the updated user
   */
  updateUser(id: string, data: UpdateUserInput): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes a user by their ID.
   * @param id - User ID to delete
   * @returns Observable emitting void on success
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Retrieves information for a specific user by ID.
   * @param id - User ID to fetch
   * @returns Observable emitting the user object
   */
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Updates the authenticated user's own profile.
   * @param data - Profile fields to update (gender, birthDate, etc.)
   * @returns Observable emitting the updated user
   */
  updateProfile(data: { name?: string; email?: string; gender?: string; birthDate?: string; height?: number; currentWeight?: number; medicalNotes?: string }): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/me`, data);
  }

  /**
   * Uploads a new profile image for the authenticated user.
   * @param file - Image file to upload (Cloudinary)
   * @returns Observable emitting the user with updated profileImageUrl
   */
  uploadProfileImage(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<User>(`${this.apiUrl}/me/profile-image`, formData);
  }

  /**
   * Deletes the authenticated user's profile image.
   * @returns Observable emitting the user with profileImageUrl set to null
   */
  deleteProfileImage(): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/me/profile-image`);
  }
}


