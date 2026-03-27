import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BodyWeightRecord {
  id: string;
  weight: number;
  date: string;
  notes?: string;
}

export interface ExerciseRecord {
  id: string;
  exercise: { id: string; name: string };
  weight: number;
  reps: number;
  date: string;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  machineType?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/performance';
  private exercisesUrl = environment.apiUrl + '/exercises';

  // Body Weight
  getBodyWeights(): Observable<BodyWeightRecord[]> {
    return this.http.get<BodyWeightRecord[]>(`${this.apiUrl}/body-weight`);
  }
  addBodyWeight(data: { weight: number; date?: string; notes?: string }): Observable<BodyWeightRecord> {
    return this.http.post<BodyWeightRecord>(`${this.apiUrl}/body-weight`, data);
  }
  deleteBodyWeight(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/body-weight/${id}`);
  }

  // Exercise Records
  getExerciseRecords(): Observable<ExerciseRecord[]> {
    return this.http.get<ExerciseRecord[]>(`${this.apiUrl}/exercise-records`);
  }
  addExerciseRecord(data: { exerciseId: string; weight: number; reps: number; date?: string; notes?: string }): Observable<ExerciseRecord> {
    return this.http.post<ExerciseRecord>(`${this.apiUrl}/exercise-records`, data);
  }
  deleteExerciseRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/exercise-records/${id}`);
  }

  // Helper to fetch all exercises
  getExercises(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(this.exercisesUrl);
  }
}
