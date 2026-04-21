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
 * =============================================================================
 * SERVICIO DE DIETAS (DIETS SERVICE)
 * =============================================================================
 * Servicio centralizado para la ingesta y manipulación de perfiles nutricionales y comidas.
 * 
 * Responsabilidades:
 * 1. Proporcionar operaciones CRUD unificadas para contenedores de Dieta.
 * 2. Manipular sub-entidades (DietMeals) anidados en planes.
 * 3. Orquestar la reorganización del orden a través de transacciones concurrentes nativas de BD.
 */
@Injectable({
  providedIn: 'root'
})
export class DietsService {
  private supabase = inject(SupabaseService).client;

  /**
   * Obtiene la lista de todos los planes dietéticos, opcionalmente filtrados por el ID de usuario.
   * @param userId - Opcional: filtrar dietas por ID de usuario
   * @returns Observable que emite un array de dietas
   */
  listDiets(userId?: string | null): Observable<Diet[]> {
    const base = this.supabase
      .from('Diet')
      .select('*')
      .order('createdAt', { ascending: false });

    const filtered = userId ? base.eq('userId', userId) : base;

    return from(filtered).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Diet[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Recupera un plan dietético específico mediante su ID.
   * @param id - El ID de la dieta a recuperar
   * @returns Observable que emite el objeto dieta
   */
  getDiet(id: string): Observable<Diet> {
    return from(
      this.supabase
        .from('Diet')
        .select('*, DietMeal(*)')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Diet;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Crea un nuevo plan dietético.
   * @param data - Datos de entrada para la nueva dieta
   * @returns Observable que emite la dieta recién creada
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
   * Actualiza un plan dietético existente.
   * @param id - El ID de la dieta a actualizar
   * @param data - Los datos actualizados
   * @returns Observable que emite la dieta actualizada
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
   * Elimina un plan dietético por su ID.
   * @param id - El ID de la dieta a eliminar
   * @returns Observable que se completa al finalizar con éxito (vacío)
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
   * Añade una comida a un plan dietético existente.
   * @param dietId - El ID de la dieta a la cual se añadirá la comida
   * @param data - Datos de entrada para el registro de la comida
   * @returns Observable que emite la entrada de comida-dieta creada
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
   * Actualiza el registro de una comida individual dentro de un plan dietético.
   * @param mealId - El ID de la comida a actualizar
   * @param data - Los datos modificados para la comida respectiva
   * @returns Observable que emite el registro de comida-dieta actualizado
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
   * Elimina una comida de un plan dietético.
   * @param mealId - El ID del registro de comida a remover
   * @returns Observable que devuelve una finalización exitosa estructurada en vacío
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
   * Reorganiza el orden de varias comidas dentro de un plan dietético.
   * @param dietId - El ID de la dieta en donde se aplicará el ordenamiento
   * @param data - Selección y nueva información de distribución de filas/orden
   * @returns Observable que emite el estado del plan dietético post-actualización
   */
  reorderDietMeals(dietId: string, data: ReorderDietMealsInput): Observable<Diet> {
    return from(Promise.resolve(data)).pipe(
      switchMap((payload: any) => {
        const updates = (payload?.meals ?? payload ?? []).map((m: any) =>
          this.supabase
            .from('DietMeal')
            .update({ order: m.order })
            .eq('id', m.id)
        );
        return from(Promise.all(updates));
      }),
      switchMap(() =>
        from(this.supabase.from('Diet').select('*').eq('id', dietId).single())
      ),
      map(({ data: diet, error }) => {
        if (error) throw error;
        return diet as Diet;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


