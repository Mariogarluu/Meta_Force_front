/**
 * =============================================================================
 * SERVICIO DE ENTRENAMIENTOS (WORKOUTS SERVICE)
 * =============================================================================
 * Este servicio gestiona las rutinas de entrenamiento y los ejercicios incluidos
 * en ellas. Permite la creación, duplicación y modificación de planes de
 * entrenamiento personalizados para los usuarios.
 * 
 * Responsabilidades:
 * 1. Gestionar el ciclo de vida de las rutinas de entrenamiento (Workout).
 * 2. Administrar la asociación y el orden de ejercicios dentro de cada rutina.
 * 3. Proporcionar funcionalidad de duplicación de rutinas existentes.
 */
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import {
  Workout,
  CreateWorkoutInput,
  UpdateWorkoutInput,
  AddExerciseToWorkoutInput,
  UpdateWorkoutExerciseInput,
  ReorderWorkoutExercisesInput,
  WorkoutExercise,
} from '../models/workout';

@Injectable({
  providedIn: 'root'
})
export class WorkoutsService {
  private supabase = inject(SupabaseService).client;

  /**
   * Lista todas las rutinas de entrenamiento, opcionalmente filtradas por usuario.
   * 
   * @param userId - ID opcional del usuario para filtrar las rutinas.
   * @returns Observable con el listado de rutinas.
   */
  listWorkouts(userId?: string | null): Observable<Workout[]> {
    const base = this.supabase
      .from('Workout')
      .select('*')
      .order('createdAt', { ascending: false });

    const filtered = userId ? base.eq('userId', userId) : base;

    return from(filtered).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Workout[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Recupera una rutina específica incluyendo sus ejercicios asociados.
   * 
   * @param id - Identificador único de la rutina.
   * @returns Observable con la rutina y sus ejercicios.
   */
  getWorkout(id: string): Observable<Workout> {
    return from(
      this.supabase
        .from('Workout')
        .select('*, WorkoutExercise(*)')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Workout;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Crea una nueva rutina de entrenamiento.
   * 
   * @param data - Datos iniciales de la rutina.
   * @returns Observable con la rutina creada.
   */
  createWorkout(data: CreateWorkoutInput): Observable<Workout> {
    return from(this.supabase.from('Workout').insert(data).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as Workout;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Actualiza los datos generales de una rutina de entrenamiento.
   * 
   * @param id - Identificador de la rutina a modificar.
   * @param data - Objeto con los campos actualizados.
   * @returns Observable con la rutina actualizada.
   */
  updateWorkout(id: string, data: UpdateWorkoutInput): Observable<Workout> {
    return from(this.supabase.from('Workout').update(data).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as Workout;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Elimina una rutina de entrenamiento y sus asociaciones.
   * 
   * @param id - Identificador de la rutina a borrar.
   * @returns Observable vacío al completar.
   */
  deleteWorkout(id: string): Observable<void> {
    return from(this.supabase.from('Workout').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Añade un ejercicio específico a una rutina existente.
   * 
   * @param workoutId - ID de la rutina destino.
   * @param data - Datos del ejercicio y configuración (series, repeticiones).
   * @returns Observable con el registro de asociación creado.
   */
  addExerciseToWorkout(workoutId: string, data: AddExerciseToWorkoutInput): Observable<WorkoutExercise> {
    return from(
      this.supabase
        .from('WorkoutExercise')
        .insert({ ...data, workoutId })
        .select('*')
        .single()
    ).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as WorkoutExercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Actualiza los parámetros de un ejercicio dentro de una rutina.
   * 
   * @param exerciseId - ID del registro de asociación (WorkoutExercise).
   * @param data - Nuevos parámetros (orden, series, etc.).
   * @returns Observable con el registro actualizado.
   */
  updateWorkoutExercise(exerciseId: string, data: UpdateWorkoutExerciseInput): Observable<WorkoutExercise> {
    return from(
      this.supabase
        .from('WorkoutExercise')
        .update(data)
        .eq('id', exerciseId)
        .select('*')
        .single()
    ).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as WorkoutExercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Elimina un ejercicio de una rutina específica.
   * 
   * @param exerciseId - ID del registro de asociación a eliminar.
   * @returns Observable vacío al completar.
   */
  removeExerciseFromWorkout(exerciseId: string): Observable<void> {
    return from(this.supabase.from('WorkoutExercise').delete().eq('id', exerciseId)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Reordena los ejercicios dentro de una rutina.
   * 
   * @param workoutId - ID de la rutina que se está reordenando.
   * @param data - Mapa de IDs y nuevas posiciones.
   * @returns Observable con la rutina actualizada.
   */
  reorderWorkoutExercises(workoutId: string, data: ReorderWorkoutExercisesInput): Observable<Workout> {
    return from(Promise.resolve(data)).pipe(
      switchMap((payload: any) => {
        const updates = (payload?.exercises ?? payload ?? []).map((e: any) =>
          this.supabase
            .from('WorkoutExercise')
            .update({ order: e.order })
            .eq('id', e.id)
        );
        return from(Promise.all(updates));
      }),
      switchMap(() =>
        from(this.supabase.from('Workout').select('*').eq('id', workoutId).single())
      ),
      map(({ data: workout, error }) => {
        if (error) throw error;
        return workout as Workout;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Crea una copia exacta de una rutina de entrenamiento.
   * La copia incluirá todos los ejercicios con sus mismos parámetros.
   * 
   * @param id - ID de la rutina original a duplicar.
   * @returns Observable con la nueva rutina duplicada.
   */
  duplicateWorkout(id: string): Observable<Workout> {
    return from(
      this.supabase
        .from('Workout')
        .select('*, WorkoutExercise(*)')
        .eq('id', id)
        .single()
    ).pipe(
      switchMap(({ data: original, error }) => {
        if (error) throw error;
        const copyName = `${original.name} (1)`;
        return from(
          this.supabase
            .from('Workout')
            .insert({
              userId: original.userId,
              name: copyName,
              description: original.description,
            })
            .select('*')
            .single()
        ).pipe(
          switchMap(({ data: createdWorkout, error: createErr }) => {
            if (createErr) throw createErr;
            const exercises = (original as any).WorkoutExercise ?? [];
            if (!exercises.length) return from(Promise.resolve(createdWorkout));
            const rows = exercises.map((e: any) => ({
              ...e,
              id: undefined,
              workoutId: createdWorkout.id,
            }));
            return from(this.supabase.from('WorkoutExercise').insert(rows)).pipe(
              map(() => createdWorkout)
            );
          })
        );
      }),
      map((workout: any) => workout as Workout),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


