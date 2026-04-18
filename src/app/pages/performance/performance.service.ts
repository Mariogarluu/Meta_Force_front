import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';

function newRowId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function normalizeExerciseEmbed(ex: unknown): { id: string; name: string } {
  if (ex && typeof ex === 'object' && !Array.isArray(ex)) {
    const o = ex as { id?: string; name?: string };
    return { id: o.id ?? '', name: o.name ?? '?' };
  }
  if (Array.isArray(ex) && ex.length && typeof ex[0] === 'object') {
    const o = ex[0] as { id?: string; name?: string };
    return { id: o.id ?? '', name: o.name ?? '?' };
  }
  return { id: '', name: '?' };
}

/** @see back/prisma schema PascalCase tables */
const T_BODY = 'BodyWeightRecord';
const T_RECORD = 'ExerciseRecord';
const T_EXERCISE = 'Exercise';

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
  machineTypeId?: string | null;
  machineType?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class PerformanceService {
  private supabase = inject(SupabaseService).client;

  private async resolveAppUserId(): Promise<string> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session?.user?.id) throw new Error('No autenticado');
    const authId = session.user.id;
    const { data: row } = await this.supabase.from('User').select('id').eq('auth_user_id', authId).maybeSingle();
    if (row && (row as { id: string }).id) return (row as { id: string }).id;
    const { data: byId } = await this.supabase.from('User').select('id').eq('id', authId).maybeSingle();
    if (byId && (byId as { id: string }).id) return (byId as { id: string }).id;
    throw new Error('Usuario de aplicación no enlazado');
  }

  getBodyWeights(): Observable<BodyWeightRecord[]> {
    return from(this.resolveAppUserId()).pipe(
      switchMap((userId) =>
        from(
          this.supabase
            .from(T_BODY)
            .select('id, weight, date, notes')
            .eq('userId', userId)
            .order('date', { ascending: false }),
        ),
      ),
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as BodyWeightRecord[];
      }),
    );
  }

  addBodyWeight(data: { weight: number; date?: string; notes?: string }): Observable<BodyWeightRecord> {
    return from(this.resolveAppUserId()).pipe(
      switchMap((userId) =>
        from(
          this.supabase
            .from(T_BODY)
            .insert({
              id: newRowId(),
              userId,
              weight: data.weight,
              date: data.date ?? new Date().toISOString(),
              notes: data.notes ?? null,
            })
            .select('id, weight, date, notes')
            .single(),
        ),
      ),
      map(({ data, error }) => {
        if (error) throw error;
        return data as BodyWeightRecord;
      }),
    );
  }

  deleteBodyWeight(id: string): Observable<void> {
    return from(
      this.supabase.from(T_BODY).delete().eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      map(() => undefined),
    );
  }

  getExerciseRecords(): Observable<ExerciseRecord[]> {
    return from(this.resolveAppUserId()).pipe(
      switchMap((userId) =>
        from(
          this.supabase
            .from(T_RECORD)
            .select('id, weight, reps, date, notes, exercise:Exercise(id, name)')
            .eq('userId', userId)
            .order('date', { ascending: false }),
        ),
      ),
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as unknown[];
        return rows.map((raw) => {
          const r = raw as Record<string, unknown>;
          return {
            id: String(r['id']),
            weight: Number(r['weight']),
            reps: Number(r['reps']),
            date: String(r['date']),
            notes: (r['notes'] as string | null | undefined) ?? undefined,
            exercise: normalizeExerciseEmbed(r['exercise']),
          };
        });
      }),
    );
  }

  addExerciseRecord(payload: {
    exerciseId: string;
    weight: number;
    reps: number;
    date?: string;
    notes?: string;
  }): Observable<ExerciseRecord> {
    return from(this.resolveAppUserId()).pipe(
      switchMap((userId) =>
        from(
          this.supabase
            .from(T_RECORD)
            .insert({
              id: newRowId(),
              userId,
              exerciseId: payload.exerciseId,
              weight: payload.weight,
              reps: payload.reps,
              date: payload.date ?? new Date().toISOString(),
              notes: payload.notes ?? null,
            })
            .select('id, weight, reps, date, notes, exercise:Exercise(id, name)')
            .single(),
        ),
      ),
      map(({ data, error }) => {
        if (error) throw error;
        const r = data as unknown as Record<string, unknown>;
        const ex = normalizeExerciseEmbed(r['exercise']);
        return {
          id: String(r['id']),
          weight: Number(r['weight']),
          reps: Number(r['reps']),
          date: String(r['date']),
          notes: (r['notes'] as string | null | undefined) ?? undefined,
          exercise: ex.id ? ex : { id: payload.exerciseId, name: '?' },
        };
      }),
    );
  }

  deleteExerciseRecord(id: string): Observable<void> {
    return from(this.supabase.from(T_RECORD).delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      map(() => undefined),
    );
  }

  getExercises(): Observable<Exercise[]> {
    return from(
      this.supabase.from(T_EXERCISE).select('id, name, machineTypeId').order('createdAt', {
        ascending: false,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Exercise[];
      }),
    );
  }
}
