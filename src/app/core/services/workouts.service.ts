import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import {
  Workout,
  CreateWorkoutInput,
  UpdateWorkoutInput,
  AddExerciseToWorkoutInput,
  UpdateWorkoutExerciseInput,
  ReorderWorkoutExercisesInput,
  WorkoutExercise,
} from '../models/workout';

/**
 * Service for managing workout routines and exercises within those routines.
 * Handles creation, duplication, and modification of workout plans.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkoutsService {
  private supabase = inject(SupabaseService).client;

  /**
   * Lists all workout routines, optionally filtered by user ID.
   * @param userId - Optional: filter workouts by user ID
   * @returns Observable emitting an array of workouts
   */
  listWorkouts(userId?: string | null): Observable<Workout[]> {
    const base = this.supabase
      .from('Workout')
      .select('*')
      .order('createdAt', { ascending: false });

    const filtered = userId ? base.eq('userId', userId) : base;

    return from(filtered).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Workout[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Retrieves a specific workout routine by its ID.
   * @param id - The ID of the workout to fetch
   * @returns Observable emitting the workout object
   */
  getWorkout(id: string): Observable<Workout> {
    return from(
      this.supabase
        .from('Workout')
        .select('*, WorkoutExercise(*)')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Workout;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Creates a new workout routine.
   * @param data - Input data for the new workout
   * @returns Observable emitting the created workout
   */
  createWorkout(data: CreateWorkoutInput): Observable<Workout> {
    return from(this.supabase.from('Workout').insert(data).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as Workout;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates an existing workout routine.
   * @param id - The ID of the workout to update
   * @param data - The updated workout data
   * @returns Observable emitting the updated workout
   */
  updateWorkout(id: string, data: UpdateWorkoutInput): Observable<Workout> {
    return from(this.supabase.from('Workout').update(data).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as Workout;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deletes a workout routine by its ID.
   * @param id - The ID of the workout to delete
   * @returns Observable emitting void on success
   */
  deleteWorkout(id: string): Observable<void> {
    return from(this.supabase.from('Workout').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Adds an exercise entry to an existing workout routine.
   * @param workoutId - The ID of the workout to add an exercise to
   * @param data - Input data for the exercise entry
   * @returns Observable emitting the created workout-exercise entry
   */
  addExerciseToWorkout(workoutId: string, data: AddExerciseToWorkoutInput): Observable<WorkoutExercise> {
    return from(
      this.supabase
        .from('WorkoutExercise')
        .insert({ ...data, workoutId })
        .select('*')
        .single()
    ).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as WorkoutExercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates an exercise entry within a workout routine.
   * @param exerciseId - The ID of the workout-exercise entry to update
   * @param data - The updated data for the entry
   * @returns Observable emitting the updated workout-exercise entry
   */
  updateWorkoutExercise(exerciseId: string, data: UpdateWorkoutExerciseInput): Observable<WorkoutExercise> {
    return from(
      this.supabase
        .from('WorkoutExercise')
        .update(data)
        .eq('id', exerciseId)
        .select('*')
        .single()
    ).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as WorkoutExercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Removes an exercise entry from a workout routine.
   * @param exerciseId - The ID of the workout-exercise entry to remove
   * @returns Observable emitting void on success
   */
  removeExerciseFromWorkout(exerciseId: string): Observable<void> {
    return from(this.supabase.from('WorkoutExercise').delete().eq('id', exerciseId)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Reorders multiple exercise entries within a workout routine.
   * @param workoutId - The ID of the workout to reorder exercises in
   * @param data - Selection and new ordering for exercises
   * @returns Observable emitting the updated workout routine
   */
  reorderWorkoutExercises(workoutId: string, data: ReorderWorkoutExercisesInput): Observable<Workout> {
    // Reorder is client-side with updates; assumes data contains ids with new order.
    // Best-effort: update rows sequentially.
    return from(Promise.resolve(data)).pipe(
      switchMap((payload: any) => {
        const updates = (payload?.exercises ?? payload ?? []).map((e: any) =>
          this.supabase
            .from('WorkoutExercise')
            .update({ order: e.order })
            .eq('id', e.id)
        );
        return from(Promise.all(updates));
      }),
      switchMap(() =>
        from(this.supabase.from('Workout').select('*').eq('id', workoutId).single())
      ),
      map(({ data: workout, error }) => {
        if (error) throw error;
        return workout as Workout;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Duplicates an existing workout routine.
   * Creates a copy with the same content and a numeric suffix in the name (e.g., "(1)").
   * @param id - The ID of the workout to duplicate
   * @returns Observable emitting the new duplicated workout
   */
  duplicateWorkout(id: string): Observable<Workout> {
    return from(
      this.supabase
        .from('Workout')
        .select('*, WorkoutExercise(*)')
        .eq('id', id)
        .single()
    ).pipe(
      switchMap(({ data: original, error }) => {
        if (error) throw error;
        const copyName = `${original.name} (1)`;
        return from(
          this.supabase
            .from('Workout')
            .insert({
              userId: original.userId,
              name: copyName,
              description: original.description,
            })
            .select('*')
            .single()
        ).pipe(
          switchMap(({ data: createdWorkout, error: createErr }) => {
            if (createErr) throw createErr;
            const exercises = (original as any).WorkoutExercise ?? [];
            if (!exercises.length) return from(Promise.resolve(createdWorkout));
            const rows = exercises.map((e: any) => ({
              ...e,
              id: undefined,
              workoutId: createdWorkout.id,
            }));
            return from(this.supabase.from('WorkoutExercise').insert(rows)).pipe(
              map(() => createdWorkout)
            );
          })
        );
      }),
      map((workout: any) => workout as Workout),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


