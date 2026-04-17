import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Meal, CreateMealInput, UpdateMealInput } from '../models/meal';
import { SupabaseService } from './supabase.service';

/**
 * Service for managing available meals and nutritional data.
 * Handles the catalog of meals and provides functionality for importing meal data.
 */
/**
 * Service for managing available meals and nutritional data.
 * Handles the catalog of meals and provides functionality for importing meal data.
 */
@Injectable({
  providedIn: 'root'
})
export class MealsService {
  private supabase = inject(SupabaseService).client;

  /**
   * Lists all available meals in the system.
   * @returns Observable emitting an array of meals
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
   * Retrieves a specific meal by its ID.
   * @param id - The ID of the meal to fetch
   * @returns Observable emitting the meal object
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
   * Creates a new meal record.
   * @param data - Input data for the new meal
   * @returns Observable emitting the created meal
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
   * Updates an existing meal record.
   * @param id - The ID of the meal to update
   * @param data - The updated meal data
   * @returns Observable emitting the updated meal
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
   * Deletes a meal record by its ID.
   * @param id - The ID of the meal to delete
   * @returns Observable emitting void on success
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
   * Bulk imports multiple meals into the system.
   * @param meals - Array of meal data to import
   * @returns Observable emitting import results (counts and errors)
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


