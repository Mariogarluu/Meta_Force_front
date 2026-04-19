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
 * =============================================================================
 * SERVICIO DE USUARIOS (USERS SERVICE)
 * =============================================================================
 * Gestiona todas las operaciones relacionadas con la persistencia de usuarios,
 * listado de perfiles, actualizaciones de datos biométricos y gestión de
 * imágenes en Supabase Storage (Cloudinary legacy).
 */
@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private supabase = inject(SupabaseService).client;

  /**
   * Lista todos los usuarios según el nivel de privilegios.
   * Recupera la información básica de todos los registros de la tabla 'User'.
   * 
   * @returns Observable con el array de usuarios.
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
   * Actualiza los datos de un usuario específico mediante su ID.
   * Solo accesible por perfiles administrativos para gestionar roles y estados.
   * 
   * @param id - ID único del usuario a actualizar.
   * @param data - Datos parciales a modificar.
   * @returns Observable con el usuario actualizado.
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
   * Actualiza el perfil del usuario actualmente autenticado.
   * Identifica al usuario de forma automática mediante la sesión de Supabase Auth.
   * 
   * @param data - Datos biométricos y personales a actualizar.
   * @returns Observable con el perfil actualizado.
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
   * Sube una nueva imagen de perfil al Storage de Supabase.
   * Gestiona la creación de rutas únicas y la actualización del campo profileImageUrl en la BD.
   * 
   * @param file - Archivo de imagen seleccionado.
   * @returns Observable con el usuario actualizado conteniendo la nueva URL.
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


