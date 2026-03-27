import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Meal, CreateMealInput, UpdateMealInput } from '../models/meal';

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
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for meal operations */
  private apiUrl = `${environment.apiUrl}/meals`;

  /**
   * Lists all available meals in the system.
   * @returns Observable emitting an array of meals
   */
  listMeals(): Observable<Meal[]> {
    return this.http.get<Meal[]>(this.apiUrl);
  }

  /**
   * Retrieves a specific meal by its ID.
   * @param id - The ID of the meal to fetch
   * @returns Observable emitting the meal object
   */
  getMeal(id: string): Observable<Meal> {
    return this.http.get<Meal>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new meal record.
   * @param data - Input data for the new meal
   * @returns Observable emitting the created meal
   */
  createMeal(data: CreateMealInput): Observable<Meal> {
    return this.http.post<Meal>(this.apiUrl, data);
  }

  /**
   * Updates an existing meal record.
   * @param id - The ID of the meal to update
   * @param data - The updated meal data
   * @returns Observable emitting the updated meal
   */
  updateMeal(id: string, data: UpdateMealInput): Observable<Meal> {
    return this.http.patch<Meal>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes a meal record by its ID.
   * @param id - The ID of the meal to delete
   * @returns Observable emitting void on success
   */
  deleteMeal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Bulk imports multiple meals into the system.
   * @param meals - Array of meal data to import
   * @returns Observable emitting import results (counts and errors)
   */
  importMeals(meals: CreateMealInput[]): Observable<{ created: number; skipped: number; errors: Array<{ meal: string; error: string }> }> {
    return this.http.post<{ created: number; skipped: number; errors: Array<{ meal: string; error: string }> }>(`${this.apiUrl}/import`, { meals });
  }
}


