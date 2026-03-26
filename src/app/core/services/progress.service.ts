import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserMeasurement {
  id: string;
  userId: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  bmi?: number;
}

export interface ExerciseLog {
  id: string;
  userId: string;
  exerciseId: string;
  date: string;
  weight?: number;
  reps?: number;
  sets?: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/progress`;

  /**
   * Registra una nueva medida física.
   */
  logMeasurement(data: { weight?: number, bodyFat?: number, bmi?: number }): Observable<UserMeasurement> {
    return this.http.post<UserMeasurement>(`${this.apiUrl}/measurements`, data);
  }

  /**
   * Obtiene el historial de medidas.
   */
  getMeasurementHistory(): Observable<UserMeasurement[]> {
    return this.http.get<UserMeasurement[]>(`${this.apiUrl}/measurements`);
  }

  /**
   * Registra rendimiento de un ejercicio.
   */
  logExercisePerformance(data: { exerciseId: string, weight?: number, reps?: number, sets?: number, notes?: string }): Observable<ExerciseLog> {
    return this.http.post<ExerciseLog>(`${this.apiUrl}/exercises`, data);
  }

  /**
   * Obtiene el historial de rendimiento para un ejercicio.
   */
  getExerciseHistory(exerciseId: string): Observable<ExerciseLog[]> {
    return this.http.get<ExerciseLog[]>(`${this.apiUrl}/exercises/${exerciseId}`);
  }
}
