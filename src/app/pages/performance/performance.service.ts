import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';

/**
 * Generates a compact, URL-safe identifier for new performance records.
 */
function newRowId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Normalizes the `exercise` embedded relation coming from Supabase so the
 * component layer can always rely on a `{ id, name }` shape.
 */
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

/**
 * Name of the body weight history table in the analytics schema.
 * @see back/prisma schema PascalCase tables
 */
const T_BODY = 'BodyWeightRecord';
/**
 * Name of the exercise record table in the analytics schema.
 * @see back/prisma schema PascalCase tables
 */
const T_RECORD = 'ExerciseRecord';
/**
 * Name of the exercise catalog table in the analytics schema.
 * @see back/prisma schema PascalCase tables
 */
const T_EXERCISE = 'Exercise';

/**
 * Represents a single body weight measurement linked to a user.
 */
export interface BodyWeightRecord {
  /** Unique identifier of the body weight row. */
  id: string;
  /** Measured body weight in kilograms. */
  weight: number;
  /** ISO timestamp when the measurement was taken. */
  date: string;
  /** Optional free‑text notes associated with the measurement. */
  notes?: string;
}

/**
 * Represents a single logged set for a given exercise (weight, reps, date).
 */
export interface ExerciseRecord {
  /** Unique identifier of the exercise record row. */
  id: string;
  /** Normalised reference to the exercised movement (id + name). */
  exercise: { id: string; name: string };
  /** Load used in the set, in kilograms. */
  weight: number;
  /** Number of repetitions performed. */
  reps: number;
  /** ISO timestamp when the set was logged. */
  date: string;
  /** Optional free‑text notes associated with the set. */
  notes?: string;
}

/**
 * Lightweight representation of an exercise used in performance analytics.
 */
export interface Exercise {
  /** Unique identifier of the exercise. */
  id: string;
  /** Human‑readable exercise name. */
  name: string;
  /** Optional foreign key to the related machine type. */
  machineTypeId?: string | null;
  /** Raw machine type payload as returned by Supabase when joined. */
  machineType?: unknown;
}

/**
 * High‑level service that encapsulates all read/write operations related to
 * performance analytics: body weight history, exercise records and events.
 */
@Injectable({
  providedIn: 'root',
})
export class PerformanceService {
  /**
   * Shared Supabase client instance used to query and mutate performance data.
   */
  private supabase = inject(SupabaseService).client;

  /**
   * Resolves the application‑level user identifier used in analytics tables,
   * performing a graceful fallback between `auth_user_id` and legacy `id`.
   */
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

  /**
   * Retrieves all body weight records for the current user ordered by date.
   */
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

  /**
   * Inserts a new body weight record and triggers the performance‑events Edge
   * Function so downstream insights can be generated asynchronously.
   */
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
      switchMap(({ data, error }) => {
        if (error) throw error;
        const record = data as BodyWeightRecord;
        return from(
          this.supabase.functions.invoke('performance-events', {
            body: { action: 'detect', kind: 'BODY_WEIGHT', recordId: record.id },
          }),
        ).pipe(
          map(() => record),
          catchError((err) => {
            console.warn('No se pudo generar el evento de performance, pero el peso se guardó:', err);
            return of(record);
          })
        );
      }),
    );
  }

  /**
   * Deletes a body weight record by its identifier.
   */
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

  /**
   * Lists all exercise performance records for the current user.
   */
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

  /**
   * Creates a new exercise performance record and notifies the analytics Edge
   * Function so it can emit high‑level events (plateaus, PRs, etc.).
   */
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
      switchMap(({ data, error }) => {
        if (error) throw error;
        const r = data as unknown as Record<string, unknown>;
        const ex = normalizeExerciseEmbed(r['exercise']);
        const record: ExerciseRecord = {
          id: String(r['id']),
          weight: Number(r['weight']),
          reps: Number(r['reps']),
          date: String(r['date']),
          notes: (r['notes'] as string | null | undefined) ?? undefined,
          exercise: ex.id ? ex : { id: payload.exerciseId, name: '?' },
        };
        return from(
          this.supabase.functions.invoke('performance-events', {
            body: {
              action: 'detect',
              kind: 'EXERCISE_RECORD',
              recordId: record.id,
            },
          }),
        ).pipe(
          map(() => record),
          catchError((err) => {
            console.warn('No se pudo generar el evento de performance, pero el récord se guardó:', err);
            return of(record);
          })
        );
      }),
    );
  }

  /**
   * Deletes a single exercise performance record by its identifier.
   */
  deleteExerciseRecord(id: string): Observable<void> {
    return from(this.supabase.from(T_RECORD).delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      map(() => undefined),
    );
  }

  /**
   * Returns the catalog of exercises that can be used in performance charts.
   */
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

  /**
   * Retrieves recent performance events generated by the `performance-events`
   * Edge Function, already resolved for the current authenticated user.
   */
  getRecentEvents(): Observable<
    { id: string; kind: string; severity: string; payload?: any; createdAt: string; acknowledgedAt?: string | null }[]
  > {
    return from(
      this.supabase.functions.invoke('performance-events', {
        body: { action: 'list' },
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as {
          id: string;
          kind: string;
          severity: string;
          payload?: any;
          createdAt: string;
          acknowledgedAt?: string | null;
        }[];
      }),
      catchError((err) => {
        console.warn('Silenciando error de performance-events (probablemente no existe la Edge Function):', err);
        return of([]);
      })
    );
  }

  /**
   * Marks a given performance event as acknowledged so it no longer appears in
   * the \"recent events\" stream.
   */
  acknowledgeEvent(id: string): Observable<void> {
    return from(
      this.supabase.functions.invoke('performance-events', {
        body: { action: 'ack', id },
      }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      map(() => undefined),
    );
  }
}
