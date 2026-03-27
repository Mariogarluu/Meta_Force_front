import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for workout operations */
  private apiUrl = `${environment.apiUrl}/workouts`;

  /**
   * Lists all workout routines, optionally filtered by user ID.
   * @param userId - Optional: filter workouts by user ID
   * @returns Observable emitting an array of workouts
   */
  listWorkouts(userId?: string | null): Observable<Workout[]> {
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    return this.http.get<Workout[]>(this.apiUrl, { params });
  }

  /**
   * Retrieves a specific workout routine by its ID.
   * @param id - The ID of the workout to fetch
   * @returns Observable emitting the workout object
   */
  getWorkout(id: string): Observable<Workout> {
    return this.http.get<Workout>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new workout routine.
   * @param data - Input data for the new workout
   * @returns Observable emitting the created workout
   */
  createWorkout(data: CreateWorkoutInput): Observable<Workout> {
    return this.http.post<Workout>(this.apiUrl, data);
  }

  /**
   * Updates an existing workout routine.
   * @param id - The ID of the workout to update
   * @param data - The updated workout data
   * @returns Observable emitting the updated workout
   */
  updateWorkout(id: string, data: UpdateWorkoutInput): Observable<Workout> {
    return this.http.patch<Workout>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes a workout routine by its ID.
   * @param id - The ID of the workout to delete
   * @returns Observable emitting void on success
   */
  deleteWorkout(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Adds an exercise entry to an existing workout routine.
   * @param workoutId - The ID of the workout to add an exercise to
   * @param data - Input data for the exercise entry
   * @returns Observable emitting the created workout-exercise entry
   */
  addExerciseToWorkout(workoutId: string, data: AddExerciseToWorkoutInput): Observable<WorkoutExercise> {
    return this.http.post<WorkoutExercise>(`${this.apiUrl}/${workoutId}/exercises`, data);
  }

  /**
   * Updates an exercise entry within a workout routine.
   * @param exerciseId - The ID of the workout-exercise entry to update
   * @param data - The updated data for the entry
   * @returns Observable emitting the updated workout-exercise entry
   */
  updateWorkoutExercise(exerciseId: string, data: UpdateWorkoutExerciseInput): Observable<WorkoutExercise> {
    return this.http.patch<WorkoutExercise>(`${this.apiUrl}/exercises/${exerciseId}`, data);
  }

  /**
   * Removes an exercise entry from a workout routine.
   * @param exerciseId - The ID of the workout-exercise entry to remove
   * @returns Observable emitting void on success
   */
  removeExerciseFromWorkout(exerciseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/exercises/${exerciseId}`);
  }

  /**
   * Reorders multiple exercise entries within a workout routine.
   * @param workoutId - The ID of the workout to reorder exercises in
   * @param data - Selection and new ordering for exercises
   * @returns Observable emitting the updated workout routine
   */
  reorderWorkoutExercises(workoutId: string, data: ReorderWorkoutExercisesInput): Observable<Workout> {
    return this.http.post<Workout>(`${this.apiUrl}/${workoutId}/reorder`, data);
  }

  /**
   * Duplicates an existing workout routine.
   * Creates a copy with the same content and a numeric suffix in the name (e.g., "(1)").
   * @param id - The ID of the workout to duplicate
   * @returns Observable emitting the new duplicated workout
   */
  duplicateWorkout(id: string): Observable<Workout> {
    return this.http.post<Workout>(`${this.apiUrl}/${id}/duplicate`, {});
  }
}


