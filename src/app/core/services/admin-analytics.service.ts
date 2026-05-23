import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
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

export interface GlobalAnalyticsData {
  users: AdminUser[];
  roles: AdminUserRole[];
  bodyWeights: AdminBodyWeightRecord[];
  exerciseRecords: AdminExerciseRecord[];
  exercises: AdminExercise[];
  subscriptions: AdminSubscription[];
}

/**
 * =============================================================================
 * SERVICIO DE ANALÍTICAS DEL SUPERADMIN
 * =============================================================================
 * Obtiene datos globales de analíticas llamando a la Edge Function
 * `admin-analytics`, que usa el service_role key server-side para bypasar RLS
 * y verifica que el usuario es SUPERADMIN antes de responder.
 *
 * Esto evita exponer el service_role key en el cliente y garantiza que solo
 * el superadmin autenticado puede acceder a los datos.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAnalyticsService {
  private supabase = inject(SupabaseService).client;

  /**
   * Obtiene todos los datos analíticos globales a través de la Edge Function.
   * La Edge Function verifica el JWT del usuario y requiere rol SUPERADMIN.
   */
  getGlobalAnalyticsData(): Observable<GlobalAnalyticsData> {
    return from(this.supabase.functions.invoke('admin-analytics')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('No data returned from admin-analytics function');
        return data as GlobalAnalyticsData;
      })
    );
  }
}
