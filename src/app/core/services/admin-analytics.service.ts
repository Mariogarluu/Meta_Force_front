import { Injectable, inject } from '@angular/core';
import { Observable, from, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  role?: string;
}

export interface AdminUserRole {
  user_id: string;
  role: string;
}

export interface AdminBodyWeightRecord {
  id: string;
  userId: string;
  weight: number;
  date: string;
}

export interface AdminExerciseRecord {
  id: string;
  userId: string;
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  exerciseName?: string;
}

export interface AdminExercise {
  id: string;
  name: string;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAnalyticsService {
  private supabase = inject(SupabaseService).client;

  /**
   * Fetches all users from Supabase.
   */
  getUsers(): Observable<AdminUser[]> {
    return from(
      this.supabase
        .from('User')
        .select('id, email, name, createdAt')
        .order('createdAt', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as AdminUser[];
      })
    );
  }

  /**
   * Fetches all user roles.
   */
  getUserRoles(): Observable<AdminUserRole[]> {
    return from(
      this.supabase
        .from('user_roles')
        .select('user_id, role')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as AdminUserRole[];
      })
    );
  }

  /**
   * Fetches all body weight records.
   */
  getBodyWeightRecords(): Observable<AdminBodyWeightRecord[]> {
    return from(
      this.supabase
        .from('BodyWeightRecord')
        .select('id, userId, weight, date')
        .order('date', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as AdminBodyWeightRecord[];
      })
    );
  }

  /**
   * Fetches all exercise records.
   */
  getExerciseRecords(): Observable<AdminExerciseRecord[]> {
    return from(
      this.supabase
        .from('ExerciseRecord')
        .select('id, userId, exerciseId, weight, reps, date')
        .order('date', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as AdminExerciseRecord[];
      })
    );
  }

  /**
   * Fetches all exercises.
   */
  getExercises(): Observable<AdminExercise[]> {
    return from(
      this.supabase
        .from('Exercise')
        .select('id, name')
        .order('name', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as AdminExercise[];
      })
    );
  }

  /**
   * Fetches all subscriptions.
   */
  getSubscriptions(): Observable<AdminSubscription[]> {
    return from(
      this.supabase
        .from('subscriptions')
        .select('id, user_id, plan_id, status, created_at')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as AdminSubscription[];
      })
    );
  }

  /**
   * Aggregates all global analytical data.
   */
  getGlobalAnalyticsData(): Observable<{
    users: AdminUser[];
    roles: AdminUserRole[];
    bodyWeights: AdminBodyWeightRecord[];
    exerciseRecords: AdminExerciseRecord[];
    exercises: AdminExercise[];
    subscriptions: AdminSubscription[];
  }> {
    return forkJoin({
      users: this.getUsers(),
      roles: this.getUserRoles(),
      bodyWeights: this.getBodyWeightRecords(),
      exerciseRecords: this.getExerciseRecords(),
      exercises: this.getExercises(),
      subscriptions: this.getSubscriptions()
    }).pipe(
      map(({ users, roles, bodyWeights, exerciseRecords, exercises, subscriptions }) => {
        // Map user roles to users for easier usage
        const roleMap = new Map(roles.map(r => [r.user_id, r.role]));
        const enrichedUsers = users.map(u => ({
          ...u,
          role: roleMap.get(u.id) || 'USER'
        }));

        // Map exercise names to exercise records for easier usage
        const exerciseMap = new Map(exercises.map(e => [e.id, e.name]));
        const enrichedExerciseRecords = exerciseRecords.map(r => ({
          ...r,
          exerciseName: exerciseMap.get(r.exerciseId) || '?'
        }));

        return {
          users: enrichedUsers,
          roles,
          bodyWeights,
          exerciseRecords: enrichedExerciseRecords,
          exercises,
          subscriptions
        };
      })
    );
  }
}
