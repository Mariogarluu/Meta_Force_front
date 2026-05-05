/**
 * =============================================================================
 * SERVICIO DE COMIDAS (MEALS SERVICE)
 * =============================================================================
 * Este servicio gestiona el catálogo de comidas y datos nutricionales.
 * Permite la administración de platos disponibles en el sistema y facilita
 * la importación masiva de datos nutricionales para la planificación de dietas.
 * 
 * Responsabilidades:
 * 1. Consultar el listado completo de comidas y sus detalles.
 * 2. Gestionar el ciclo de vida (CRUD) de los registros de comidas.
 * 3. Realizar importaciones masivas de platos y su información nutricional.
 */
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Meal, CreateMealInput, UpdateMealInput } from '../models/meal';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class MealsService {
  /** Supabase client used to query and manage the Meals catalog. */
  private supabase = inject(SupabaseService).client;

  /**
   * Lista todas las comidas disponibles en el sistema.
   * 
   * @returns Observable con el listado de comidas ordenadas por nombre.
   */
  listMeals(): Observable<Meal[]> {
    return from(this.supabase.from('Meal').select('*').order('name', { ascending: true })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Meal[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Recupera una comida específica mediante su identificador.
   * 
   * @param id - Identificador único de la comida.
   * @returns Observable con los detalles de la comida.
   */
  getMeal(id: string): Observable<Meal> {
    return from(this.supabase.from('Meal').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Meal;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Crea un nuevo registro de comida en el sistema.
   * 
   * @param data - Datos nutricionales y descriptivos de la nueva comida.
   * @returns Observable con la comida recién creada.
   */
  createMeal(data: CreateMealInput): Observable<Meal> {
    return from(this.supabase.from('Meal').insert(data).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as Meal;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Actualiza los datos de una comida existente.
   * 
   * @param id - Identificador de la comida a modificar.
   * @param data - Objeto con los campos nutricionales actualizados.
   * @returns Observable con la comida actualizada.
   */
  updateMeal(id: string, data: UpdateMealInput): Observable<Meal> {
    return from(this.supabase.from('Meal').update(data).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as Meal;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Elimina un registro de comida del catálogo.
   * 
   * @param id - Identificador de la comida a borrar.
   * @returns Observable vacío al completar la operación.
   */
  deleteMeal(id: string): Observable<void> {
    return from(this.supabase.from('Meal').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Realiza una importación masiva de múltiples platos.
   * 
   * @param meals - Listado de comidas a importar.
   * @returns Observable con el resumen del resultado de la importación.
   */
  importMeals(meals: CreateMealInput[]): Observable<{ created: number; skipped: number; errors: Array<{ meal: string; error: string }> }> {
    return from(this.supabase.from('Meal').insert(meals).select('id')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return { created: data?.length ?? 0, skipped: 0, errors: [] };
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


