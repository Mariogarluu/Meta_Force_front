import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Record representing a user's body weight measurement at a specific point in time.
 */
export interface BodyWeightRecord {
  /** Unique record identifier */
  id: string;
  /** Body weight in kilograms */
  weight: number;
  /** ISO date string or formatted date */
  date: string;
  /** Optional personal notes or context */
  notes?: string;
}

/**
 * Record representing a performance achieved in a specific exercise.
 */
export interface ExerciseRecord {
  /** Unique record identifier */
  id: string;
  /** Minimal exercise metadata associated with this performance */
  exercise: { id: string; name: string };
  /** Weight lifted in kilograms */
  weight: number;
  /** Number of repetitions performed */
  reps: number;
  /** ISO date string or formatted date */
  date: string;
  /** Optional performance-related notes */
  notes?: string;
}

/**
 * Representation of a gym movement or exercise available in the system.
 */
export interface Exercise {
  /** Unique exercise identifier */
  id: string;
  /** Name of the exercise */
  name: string;
  /** Associated machine type metadata, if any */
  machineType?: any;
}

/**
 * Service for managing user performance data, including body weight and exercise tracking.
 * Connects to the performance and exercises API endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  /** Injected HttpClient for backend communication */
  private http = inject(HttpClient);
  /** Base URL for performance-related endpoints */
  private apiUrl = environment.apiUrl + '/performance';
  /** URL for exercise definitions */
  private exercisesUrl = environment.apiUrl + '/exercises';

  /**
   * Retrieves all historical body weight records for the current user.
   * @returns Observable array of body weight records
   */
  getBodyWeights(): Observable<BodyWeightRecord[]> {
    return this.http.get<BodyWeightRecord[]>(`${this.apiUrl}/body-weight`);
  }

  /**
   * Records a new body weight measurement.
   * @param data - The weight, date, and optional notes for the record
   * @returns Observable of the newly created record
   */
  addBodyWeight(data: { weight: number; date?: string; notes?: string }): Observable<BodyWeightRecord> {
    return this.http.post<BodyWeightRecord>(`${this.apiUrl}/body-weight`, data);
  }

  /**
   * Deletes a specific body weight record.
   * @param id - The ID of the record to remove
   * @returns Empty observable confirming deletion
   */
  deleteBodyWeight(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/body-weight/${id}`);
  }

  /**
   * Retrieves all logged performance records across all exercises.
   * @returns Observable array of exercise records
   */
  getExerciseRecords(): Observable<ExerciseRecord[]> {
    return this.http.get<ExerciseRecord[]>(`${this.apiUrl}/exercise-records`);
  }

  /**
   * Logs a new performance achievement for a specific exercise.
   * @param data - Movement details including weight, reps, and exercise ID
   * @returns Observable of the recorded achievement
   */
  addExerciseRecord(data: { exerciseId: string; weight: number; reps: number; date?: string; notes?: string }): Observable<ExerciseRecord> {
    return this.http.post<ExerciseRecord>(`${this.apiUrl}/exercise-records`, data);
  }

  /**
   * Deletes a specific exercise achievement record.
   * @param id - The ID of the record to remove
   * @returns Empty observable confirming deletion
   */
  deleteExerciseRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/exercise-records/${id}`);
  }

  /**
   * Fetches the global catalog of exercises.
   * Used for populating selectors and matching records to names.
   * @returns Observable array of available exercises
   */
  getExercises(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(this.exercisesUrl);
  }
}
