import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Represents a historical physical measurement of a user.
 */
export interface UserMeasurement {
  /** Unique identifier for the measurement */
  id: string;
  /** ID of the user the measurement belongs to */
  userId: string;
  /** ISO date string of the measurement */
  date: string;
  /** User's weight in kg */
  weight?: number;
  /** Body fat percentage */
  bodyFat?: number;
  /** Body Mass Index */
  bmi?: number;
}

/**
 * Represents a record of a specific exercise's performance.
 */
export interface ExerciseLog {
  /** Unique identifier for the log entry */
  id: string;
  /** ID of the user who performed the exercise */
  userId: string;
  /** ID of the exercise performed */
  exerciseId: string;
  /** ISO date string of the performance */
  date: string;
  /** Weight used in the exercise (kg) */
  weight?: number;
  /** Repetitions performed */
  reps?: number;
  /** Sets performed */
  sets?: number;
  /** Optional notes about the performance */
  notes?: string;
}

/**
 * Service for tracking user physical progress and exercise performance.
 * Handles logging and retrieving measurement and exercise history.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for progress operations */
  private apiUrl = `${environment.apiUrl}/progress`;

  /**
   * Logs a new physical measurement for the current user.
   * @param data - Measurement data (weight, body fat, BMI)
   * @returns Observable emitting the created measurement
   */
  logMeasurement(data: { weight?: number, bodyFat?: number, bmi?: number }): Observable<UserMeasurement> {
    return this.http.post<UserMeasurement>(`${this.apiUrl}/measurements`, data);
  }

  /**
   * Retrieves the full measurement history for the current user.
   * @returns Observable emitting an array of measurements
   */
  getMeasurementHistory(): Observable<UserMeasurement[]> {
    return this.http.get<UserMeasurement[]>(this.apiUrl + '/measurements');
  }

  /**
   * Logs a performance record for a specific exercise.
   * @param data - Exercise performance data
   * @returns Observable emitting the created exercise log
   */
  logExercisePerformance(data: { exerciseId: string, weight?: number, reps?: number, sets?: number, notes?: string }): Observable<ExerciseLog> {
    return this.http.post<ExerciseLog>(`${this.apiUrl}/exercises`, data);
  }

  /**
   * Retrieves the performance history for a specific exercise.
   * @param exerciseId - The ID of the exercise to query
   * @returns Observable emitting an array of exercise logs
   */
  getExerciseHistory(exerciseId: string): Observable<ExerciseLog[]> {
    return this.http.get<ExerciseLog[]>(`${this.apiUrl}/exercises/${exerciseId}`);
  }
}
