import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import {
  Diet,
  CreateDietInput,
  UpdateDietInput,
  AddMealToDietInput,
  UpdateDietMealInput,
  ReorderDietMealsInput,
  DietMeal,
} from '../models/diet';

/**
 * Service for managing dietary plans and meals within those plans.
 * Provides CRUD operations for diets and allows for reordering and updating meals.
 */
@Injectable({
  providedIn: 'root'
})
export class DietsService {
  private supabase = inject(SupabaseService).client;

  /**
   * Lists all dietary plans, optionally filtered by user ID.
   * @param userId - Optional: filter diets by user ID
   * @returns Observable emitting an array of diets
   */
  listDiets(userId?: string | null): Observable<Diet[]> {
    // 1. Inicializar la consulta base a la tabla 'Diet', ordenando por fecha de creación descendente (más recientes primero)
    const base = this.supabase
      .from('Diet')
      .select('*')
      .order('createdAt', { ascending: false });

    // 2. Si se proporciona un userId, aplicar un filtro eq('userId', userId), de lo contrario recuperar todas (si hay permisos)
    const filtered = userId ? base.eq('userId', userId) : base;

    // 3. Convertir el Promise resultante en un Observable e interceptar datos/errores
    return from(filtered).pipe(
      map(({ data, error }) => {
        // 4. Si Supabase devuelve un error en la ejecución, lanzarlo hacia el catchError
        if (error) throw error;
        // 5. Devolver los resultados tipiados o un array vacío por defecto
        return (data ?? []) as Diet[];
      }),
      // 6. Capturar y formatear posibles excepciones para emitirlas controladamente en el flujo RxJS
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Retrieves a specific dietary plan by its ID.
   * @param id - The ID of the diet to fetch
   * @returns Observable emitting the diet object
   */
  getDiet(id: string): Observable<Diet> {
    // 1. Solicita una única dieta por 'id', uniendo los campos de la tabla relacionada 'DietMeal'
    return from(
      this.supabase
        .from('Diet')
        .select('*, DietMeal(*)')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        // 2. Comprobar errores DB
        if (error) throw error;
        // 3. Devolver la dieta con sus comidas anidadas
        return data as Diet;
      }),
      // 4. Error handling integrado
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Creates a new dietary plan.
   * @param data - Input data for the new diet
   * @returns Observable emitting the created diet
   */
  createDiet(data: CreateDietInput): Observable<Diet> {
    return from(this.supabase.from('Diet').insert(data).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as Diet;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates an existing dietary plan.
   * @param id - The ID of the diet to update
   * @param data - The updated data
   * @returns Observable emitting the updated diet
   */
  updateDiet(id: string, data: UpdateDietInput): Observable<Diet> {
    return from(this.supabase.from('Diet').update(data).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as Diet;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deletes a dietary plan by its ID.
   * @param id - The ID of the diet to delete
   * @returns Observable emitting void on success
   */
  deleteDiet(id: string): Observable<void> {
    return from(this.supabase.from('Diet').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Adds a meal to an existing dietary plan.
   * @param dietId - The ID of the diet to add a meal to
   * @param data - Input data for the meal entry
   * @returns Observable emitting the created diet-meal entry
   */
  addMealToDiet(dietId: string, data: AddMealToDietInput): Observable<DietMeal> {
    return from(
      this.supabase
        .from('DietMeal')
        .insert({ ...data, dietId })
        .select('*')
        .single()
    ).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as DietMeal;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates a meal entry within a dietary plan.
   * @param mealId - The ID of the diet-meal entry to update
   * @param data - The updated data for the entry
   * @returns Observable emitting the updated diet-meal entry
   */
  updateDietMeal(mealId: string, data: UpdateDietMealInput): Observable<DietMeal> {
    return from(this.supabase.from('DietMeal').update(data).eq('id', mealId).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as DietMeal;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Removes a meal from a dietary plan.
   * @param mealId - The ID of the diet-meal entry to remove
   * @returns Observable emitting void on success
   */
  removeMealFromDiet(mealId: string): Observable<void> {
    return from(this.supabase.from('DietMeal').delete().eq('id', mealId)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Reorders multiple meals within a dietary plan.
   * @param dietId - The ID of the diet to reorder meals in
   * @param data - Selection and new ordering for meals
   * @returns Observable emitting the updated diet plan
   */
  reorderDietMeals(dietId: string, data: ReorderDietMealsInput): Observable<Diet> {
    // 1. Iniciar pipeline de promesas a partir del input data provisto
    return from(Promise.resolve(data)).pipe(
      switchMap((payload: any) => {
        // 2. Extraer arreglo de comidas y generar individualmente las promesas de actualización (order)
        const updates = (payload?.meals ?? payload ?? []).map((m: any) =>
          this.supabase
            .from('DietMeal')
            .update({ order: m.order })
            .eq('id', m.id)
        );
        // 3. Ejecutar todas las actualizaciones de manera concurrente con Promise.all
        return from(Promise.all(updates));
      }),
      switchMap(() =>
        // 4. Tras completar el reordenamiento, consultar de nuevo la dieta para tener el estado actualizado
        from(this.supabase.from('Diet').select('*').eq('id', dietId).single())
      ),
      map(({ data: diet, error }) => {
        // 5. Revisar último error resultante de la consulta final
        if (error) throw error;
        return diet as Diet;
      }),
      // 6. Gestionar fallback final de RxJS
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


