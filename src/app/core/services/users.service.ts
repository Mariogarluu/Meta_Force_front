import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { User, Role, UserStatus } from '../models/user';
import { SupabaseService } from './supabase.service';

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
  private supabase = inject(SupabaseService).client;

  /**
   * Lists all users visible to the authenticated user.
   * SUPERADMIN sees all, ADMIN_CENTER only users from their center.
   * @returns Observable emitting an array of users
   */
  listUsers(): Observable<User[]> {
    return from(
      this.supabase.from('User').select('*').order('createdAt', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as User[];
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Lists all active trainers.
   * Accessible to all authenticated users.
   * @param centerId - Optional: filter trainers by favorite center
   * @returns Observable emitting an array of trainers
   */
  listTrainers(centerId?: string | null): Observable<User[]> {
    const query = this.supabase
      .from('User')
      .select('*')
      .eq('role', 'TRAINER')
      .eq('status', 'ACTIVE');

    const filtered = centerId ? query.eq('favoriteCenterId', centerId) : query;

    return from(filtered.order('name', { ascending: true })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as User[];
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates data for a specific user identified by ID.
   * Allows modifying name, email, role, status, and center based on permissions.
   * @param id - User ID to update
   * @param data - Updated user data
   * @returns Observable emitting the updated user
   */
  updateUser(id: string, data: UpdateUserInput): Observable<User> {
    return from(
      this.supabase.from('User').update(data).eq('id', id).select('*').single()
    ).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as User;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deletes a user by their ID.
   * @param id - User ID to delete
   * @returns Observable emitting void on success
   */
  deleteUser(id: string): Observable<void> {
    return from(this.supabase.from('User').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Retrieves information for a specific user by ID.
   * @param id - User ID to fetch
   * @returns Observable emitting the user object
   */
  getUser(id: string): Observable<User> {
    return from(this.supabase.from('User').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as User;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates the authenticated user's own profile.
   * @param data - Profile fields to update (gender, birthDate, etc.)
   * @returns Observable emitting the updated user
   */
  updateProfile(data: { name?: string; email?: string; gender?: string; birthDate?: string; height?: number; currentWeight?: number; medicalNotes?: string }): Observable<User> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: authData, error: authErr }) => {
        if (authErr || !authData.user) {
          return throwError(() => new Error(authErr?.message || 'Unauthorized'));
        }
        return from(
          this.supabase
            .from('User')
            .update(data)
            .eq('auth_user_id', authData.user.id)
            .select('*')
            .single()
        );
      }),
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as User;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Uploads a new profile image for the authenticated user.
   * @param file - Image file to upload (Cloudinary)
   * @returns Observable emitting the user with updated profileImageUrl
   */
  uploadProfileImage(file: File): Observable<User> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: authData, error: authErr }) => {
        if (authErr || !authData.user) {
          return throwError(() => new Error(authErr?.message || 'Unauthorized'));
        }

        const userId = authData.user.id;
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${userId}/avatar.${ext}`;

        return from(
          this.supabase.storage.from('profiles').upload(path, file, { upsert: true })
        ).pipe(
          switchMap(({ error: uploadErr }) => {
            if (uploadErr) throw uploadErr;
            const { data: urlData } = this.supabase.storage.from('profiles').getPublicUrl(path);
            const publicUrl = urlData.publicUrl;
            return from(
              this.supabase
                .from('User')
                .update({ profileImageUrl: publicUrl })
                .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
                .select('*')
                .single()
            );
          })
        );
      }),
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as User;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deletes the authenticated user's profile image.
   * @returns Observable emitting the user with profileImageUrl set to null
   */
  deleteProfileImage(): Observable<User> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: authData, error: authErr }) => {
        if (authErr || !authData.user) {
          return throwError(() => new Error(authErr?.message || 'Unauthorized'));
        }
        const userId = authData.user.id;

        // Best-effort: remove common avatar paths
        const paths = [`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`];
        return from(this.supabase.storage.from('profiles').remove(paths)).pipe(
          switchMap(() =>
            from(
              this.supabase
                .from('User')
                .update({ profileImageUrl: null })
                .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
                .select('*')
                .single()
            )
          )
        );
      }),
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as User;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }
}


