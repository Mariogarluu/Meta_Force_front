/**
 * =============================================================================
 * SERVICIO DE EJERCICIOS (EXERCISES SERVICE)
 * =============================================================================
 * Este servicio gestiona la biblioteca de ejercicios y tipos de máquinas.
 * Proporciona acceso al catálogo de ejercicios disponibles para los usuarios
 * y entrenadores, permitiendo la gestión individual y la importación masiva.
 * 
 * Responsabilidades:
 * 1. Consultar el catálogo de ejercicios con filtros opcionales.
 * 2. Gestionar el ciclo de vida (CRUD) de los registros de ejercicios.
 * 3. Realizar importaciones masivas de datos técnicos de ejercicios.
 */
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Exercise, CreateExerciseInput, UpdateExerciseInput } from '../models/exercise';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ExercisesService {
  /** Supabase client used to access and mutate the Exercise catalog. */
  private supabase = inject(SupabaseService).client;

  /**
   * Lista los ejercicios disponibles, opcionalmente filtrados por tipo de máquina.
   * 
   * @param machineTypeId - ID opcional de la máquina para filtrar.
   * @returns Observable con el listado de ejercicios.
   */
  listExercises(machineTypeId?: string | null): Observable<Exercise[]> {
    const base = this.supabase
      .from('Exercise')
      .select('*')
      .order('name', { ascending: true });

    const filtered = machineTypeId ? base.eq('machineTypeId', machineTypeId) : base;

    return from(filtered).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Exercise[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Recupera un ejercicio específico mediante su identificador.
   * 
   * @param id - Identificador único del ejercicio.
   * @returns Observable con los detalles del ejercicio.
   */
  getExercise(id: string): Observable<Exercise> {
    return from(this.supabase.from('Exercise').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Exercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Crea un nuevo registro de ejercicio en el sistema.
   * 
   * @param data - Datos necesarios para la creación del ejercicio.
   * @returns Observable con el ejercicio recién creado.
   */
  createExercise(data: CreateExerciseInput): Observable<Exercise> {
    const payload = {
      id: 'c' + crypto.randomUUID().replace(/-/g, '').substring(0, 24),
      ...data,
      updatedAt: new Date().toISOString()
    };
    return from(this.supabase.from('Exercise').insert(payload).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as Exercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Actualiza los datos de un ejercicio existente.
   * 
   * @param id - Identificador del ejercicio a modificar.
   * @param data - Objeto con los campos actualizados.
   * @returns Observable con el ejercicio actualizado.
   */
  updateExercise(id: string, data: UpdateExerciseInput): Observable<Exercise> {
    const payload = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    return from(this.supabase.from('Exercise').update(payload).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as Exercise;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Elimina un ejercicio del catálogo permanente.
   * 
   * @param id - Identificador del ejercicio a borrar.
   * @returns Observable vacío al completar la operación.
   */
  deleteExercise(id: string): Observable<void> {
    return from(this.supabase.from('Exercise').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Realiza una importación masiva de múltiples ejercicios.
   * 
   * @param exercises - Listado de ejercicios a importar.
   * @returns Observable con el resumen del resultado de la importación.
   */
  importExercises(exercises: CreateExerciseInput[]): Observable<{ created: number; skipped: number; errors: Array<{ exercise: string; error: string }> }> {
    const payload = exercises.map(ex => ({
      id: 'c' + crypto.randomUUID().replace(/-/g, '').substring(0, 24),
      ...ex,
      updatedAt: new Date().toISOString()
    }));
    return from(this.supabase.from('Exercise').insert(payload).select('id')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return { created: data?.length ?? 0, skipped: 0, errors: [] };
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


