import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

/**
 * Represents a historical physical measurement of a user.
 */
export interface UserMeasurement {
  id: string;
  userId: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  bmi?: number;
}

/**
 * Represents a record of a specific exercise's performance.
 */
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

/**
 * Service for tracking user physical progress and exercise performance.
 * Handles logging and retrieving measurement and exercise history using Supabase.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  /**
   * Logs a new physical measurement for the current user.
   */
  logMeasurement(data: { weight?: number, bodyFat?: number, bmi?: number }): Observable<UserMeasurement> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    return from(this.supabase
      .from('UserMeasurement')
      .insert([{
        userId,
        weight: data.weight,
        bodyFat: data.bodyFat,
        bmi: data.bmi,
        date: new Date().toISOString()
      }])
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as UserMeasurement;
      })
    );
  }

  /**
   * Retrieves the full measurement history for the current user.
   */
  getMeasurementHistory(): Observable<UserMeasurement[]> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    return from(this.supabase
      .from('UserMeasurement')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as UserMeasurement[];
      })
    );
  }

  /**
   * Logs a performance record for a specific exercise.
   */
  logExercisePerformance(data: { exerciseId: string, weight?: number, reps?: number, sets?: number, notes?: string }): Observable<ExerciseLog> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    return from(this.supabase
      .from('ExerciseLog')
      .insert([{
        userId,
        exerciseId: data.exerciseId,
        weight: data.weight,
        reps: data.reps,
        sets: data.sets,
        notes: data.notes,
        date: new Date().toISOString()
      }])
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ExerciseLog;
      })
    );
  }

  /**
   * Retrieves the performance history for a specific exercise.
   */
  getExerciseHistory(exerciseId: string): Observable<ExerciseLog[]> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    return from(this.supabase
      .from('ExerciseLog')
      .select('*')
      .eq('userId', userId)
      .eq('exerciseId', exerciseId)
      .order('date', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ExerciseLog[];
      })
    );
  }
}
