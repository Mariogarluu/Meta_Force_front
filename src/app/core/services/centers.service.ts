import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Center, CreateCenterInput, UpdateCenterInput } from '../models/center';
import { SupabaseService } from './supabase.service';

/**
 * Service for managing training centers and their metadata.
 * Provides functionality for listing, retrieving, and performing administrative 
 * operations (create/update/delete) on gym centers.
 */
/**
 * Service for managing training centers and their metadata.
 * Provides functionality for listing, retrieving, and performing administrative 
 * operations (create/update/delete) on gym centers.
 */
@Injectable({
  providedIn: 'root'
})
export class CentersService {
  private supabase = inject(SupabaseService).client;

  /**
   * Lists all training centers.
   * Permissions vary by role (SUPERADMIN/ADMIN_CENTER see IDs, others see names only).
   * @returns Observable emitting an array of centers
   */
  listCenters(): Observable<Center[]> {
    return from(this.supabase.from('Center').select('*').order('name', { ascending: true })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Center[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Lists all centers with their IDs exposed.
   * Accessible to all authenticated users; typically used for registration and trainer filters.
   * @returns Observable emitting an array of centers with IDs
   */
  listCentersWithIds(): Observable<Center[]> {
    return this.listCenters();
  }

  /**
   * Retrieves a specific center by its ID.
   * Accessible only to ADMIN_CENTER and SUPERADMIN.
   * @param id - The ID of the center to fetch
   * @returns Observable emitting the center object
   */
  getCenter(id: string): Observable<Center> {
    return from(this.supabase.from('Center').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Center;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Creates a new training center.
   * Accessible only to SUPERADMIN.
   * @param data - Input data for the new center
   * @returns Observable emitting the created center
   */
  createCenter(data: CreateCenterInput): Observable<Center> {
    return from(this.supabase.from('Center').insert(data).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as Center;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates an existing training center's information.
   * Accessible only to SUPERADMIN.
   * @param id - The ID of the center to update
   * @param data - The updated center data
   * @returns Observable emitting the updated center
   */
  updateCenter(id: string, data: UpdateCenterInput): Observable<Center> {
    return from(this.supabase.from('Center').update(data).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as Center;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deletes a training center from the system.
   * Accessible only to SUPERADMIN.
   * @param id - The ID of the center to delete
   * @returns Observable emitting void on success
   */
  deleteCenter(id: string): Observable<void> {
    return from(this.supabase.from('Center').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


