import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Exercise, CreateExerciseInput, UpdateExerciseInput } from '../models/exercise';

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
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for exercise operations */
  private apiUrl = `${environment.apiUrl}/exercises`;

  /**
   * Lists available exercises, optionally filtered by machine type.
   * @param machineTypeId - Optional: filter exercises by machine type ID
   * @returns Observable emitting an array of exercises
   */
  listExercises(machineTypeId?: string | null): Observable<Exercise[]> {
    const params: any = {};
    if (machineTypeId) {
      params.machineTypeId = machineTypeId;
    }
    return this.http.get<Exercise[]>(this.apiUrl, { params });
  }

  /**
   * Retrieves a specific exercise by its ID.
   * @param id - The ID of the exercise to fetch
   * @returns Observable emitting the exercise object
   */
  getExercise(id: string): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new exercise record.
   * @param data - Input data for the new exercise
   * @returns Observable emitting the created exercise
   */
  createExercise(data: CreateExerciseInput): Observable<Exercise> {
    return this.http.post<Exercise>(this.apiUrl, data);
  }

  /**
   * Updates an existing exercise record.
   * @param id - The ID of the exercise to update
   * @param data - The updated exercise data
   * @returns Observable emitting the updated exercise
   */
  updateExercise(id: string, data: UpdateExerciseInput): Observable<Exercise> {
    return this.http.patch<Exercise>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes an exercise record by its ID.
   * @param id - The ID of the exercise to delete
   * @returns Observable emitting void on success
   */
  deleteExercise(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Bulk imports multiple exercises into the system.
   * @param exercises - Array of exercise data to import
   * @returns Observable emitting import results (counts and errors)
   */
  importExercises(exercises: CreateExerciseInput[]): Observable<{ created: number; skipped: number; errors: Array<{ exercise: string; error: string }> }> {
    return this.http.post<{ created: number; skipped: number; errors: Array<{ exercise: string; error: string }> }>(`${this.apiUrl}/import`, { exercises });
  }
}


