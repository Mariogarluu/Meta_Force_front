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

@Injectable({
  providedIn: 'root'
})
export class WorkoutsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/workouts`;

  listWorkouts(userId?: string | null): Observable<Workout[]> {
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    return this.http.get<Workout[]>(this.apiUrl, { params });
  }

  getWorkout(id: string): Observable<Workout> {
    return this.http.get<Workout>(`${this.apiUrl}/${id}`);
  }

  createWorkout(data: CreateWorkoutInput): Observable<Workout> {
    return this.http.post<Workout>(this.apiUrl, data);
  }

  updateWorkout(id: string, data: UpdateWorkoutInput): Observable<Workout> {
    return this.http.patch<Workout>(`${this.apiUrl}/${id}`, data);
  }

  deleteWorkout(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addExerciseToWorkout(workoutId: string, data: AddExerciseToWorkoutInput): Observable<WorkoutExercise> {
    return this.http.post<WorkoutExercise>(`${this.apiUrl}/${workoutId}/exercises`, data);
  }

  updateWorkoutExercise(exerciseId: string, data: UpdateWorkoutExerciseInput): Observable<WorkoutExercise> {
    return this.http.patch<WorkoutExercise>(`${this.apiUrl}/exercises/${exerciseId}`, data);
  }

  removeExerciseFromWorkout(exerciseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/exercises/${exerciseId}`);
  }

  reorderWorkoutExercises(workoutId: string, data: ReorderWorkoutExercisesInput): Observable<Workout> {
    return this.http.post<Workout>(`${this.apiUrl}/${workoutId}/reorder`, data);
  }

  /**
   * Duplica un entrenamiento existente.
   * Crea una copia con el mismo contenido y un sufijo en el nombre (1), (2), etc.
   */
  duplicateWorkout(id: string): Observable<Workout> {
    return this.http.post<Workout>(`${this.apiUrl}/${id}/duplicate`, {});
  }
}

