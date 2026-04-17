import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Exercise, CreateExerciseInput, UpdateExerciseInput } from '../models/exercise';
import { SupabaseService } from './supabase.service';

/**
 * Service for managing the library of exercises and machine types.
 * Supports individual record management and bulk import of exercises.
 */
/**
 * Service for managing the library of exercises and machine types.
 * Supports individual record management and bulk import of exercises.
 */
@Injectable({
  providedIn: 'root'
})
export class ExercisesService {
  private supabase = inject(SupabaseService).client;

  /**
   * Lists available exercises, optionally filtered by machine type.
   * @param machineTypeId - Optional: filter exercises by machine type ID
   * @returns Observable emitting an array of exercises
   */
  listExercises(machineTypeId?: string | null): Observable<Exercise[]> {
    const base = this.supabase
      .from('Exercise')
      .select('*')
      .order('name', { ascending: true });

    const filtered = machineTypeId ? base.eq('machineTypeId', machineTypeId) : base;

    return from(filtered).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Exercise[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Retrieves a specific exercise by its ID.
   * @param id - The ID of the exercise to fetch
   * @returns Observable emitting the exercise object
   */
  getExercise(id: string): Observable<Exercise> {
    return from(this.supabase.from('Exercise').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Exercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Creates a new exercise record.
   * @param data - Input data for the new exercise
   * @returns Observable emitting the created exercise
   */
  createExercise(data: CreateExerciseInput): Observable<Exercise> {
    return from(this.supabase.from('Exercise').insert(data).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as Exercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates an existing exercise record.
   * @param id - The ID of the exercise to update
   * @param data - The updated exercise data
   * @returns Observable emitting the updated exercise
   */
  updateExercise(id: string, data: UpdateExerciseInput): Observable<Exercise> {
    return from(this.supabase.from('Exercise').update(data).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as Exercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deletes an exercise record by its ID.
   * @param id - The ID of the exercise to delete
   * @returns Observable emitting void on success
   */
  deleteExercise(id: string): Observable<void> {
    return from(this.supabase.from('Exercise').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Bulk imports multiple exercises into the system.
   * @param exercises - Array of exercise data to import
   * @returns Observable emitting import results (counts and errors)
   */
  importExercises(exercises: CreateExerciseInput[]): Observable<{ created: number; skipped: number; errors: Array<{ exercise: string; error: string }> }> {
    return from(this.supabase.from('Exercise').insert(exercises).select('id')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return { created: data?.length ?? 0, skipped: 0, errors: [] };
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


