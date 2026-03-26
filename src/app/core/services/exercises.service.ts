import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Exercise, CreateExerciseInput, UpdateExerciseInput } from '../models/exercise';

/**
 * Service for managing the library of exercises and machine types.
 * Supports individual record management and bulk import of exercises.
 */
@Injectable({
  providedIn: 'root'
})
export class ExercisesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/exercises`;

  listExercises(machineTypeId?: string | null): Observable<Exercise[]> {
    const params: any = {};
    if (machineTypeId) {
      params.machineTypeId = machineTypeId;
    }
    return this.http.get<Exercise[]>(this.apiUrl, { params });
  }

  getExercise(id: string): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.apiUrl}/${id}`);
  }

  createExercise(data: CreateExerciseInput): Observable<Exercise> {
    return this.http.post<Exercise>(this.apiUrl, data);
  }

  updateExercise(id: string, data: UpdateExerciseInput): Observable<Exercise> {
    return this.http.patch<Exercise>(`${this.apiUrl}/${id}`, data);
  }

  deleteExercise(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  importExercises(exercises: CreateExerciseInput[]): Observable<{ created: number; skipped: number; errors: Array<{ exercise: string; error: string }> }> {
    return this.http.post<{ created: number; skipped: number; errors: Array<{ exercise: string; error: string }> }>(`${this.apiUrl}/import`, { exercises });
  }
}

