import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for diet operations */
  private apiUrl = `${environment.apiUrl}/diets`;

  /**
   * Lists all dietary plans, optionally filtered by user ID.
   * @param userId - Optional: filter diets by user ID
   * @returns Observable emitting an array of diets
   */
  listDiets(userId?: string | null): Observable<Diet[]> {
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    return this.http.get<Diet[]>(this.apiUrl, { params });
  }

  /**
   * Retrieves a specific dietary plan by its ID.
   * @param id - The ID of the diet to fetch
   * @returns Observable emitting the diet object
   */
  getDiet(id: string): Observable<Diet> {
    return this.http.get<Diet>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new dietary plan.
   * @param data - Input data for the new diet
   * @returns Observable emitting the created diet
   */
  createDiet(data: CreateDietInput): Observable<Diet> {
    return this.http.post<Diet>(this.apiUrl, data);
  }

  /**
   * Updates an existing dietary plan.
   * @param id - The ID of the diet to update
   * @param data - The updated data
   * @returns Observable emitting the updated diet
   */
  updateDiet(id: string, data: UpdateDietInput): Observable<Diet> {
    return this.http.patch<Diet>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes a dietary plan by its ID.
   * @param id - The ID of the diet to delete
   * @returns Observable emitting void on success
   */
  deleteDiet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Adds a meal to an existing dietary plan.
   * @param dietId - The ID of the diet to add a meal to
   * @param data - Input data for the meal entry
   * @returns Observable emitting the created diet-meal entry
   */
  addMealToDiet(dietId: string, data: AddMealToDietInput): Observable<DietMeal> {
    return this.http.post<DietMeal>(`${this.apiUrl}/${dietId}/meals`, data);
  }

  /**
   * Updates a meal entry within a dietary plan.
   * @param mealId - The ID of the diet-meal entry to update
   * @param data - The updated data for the entry
   * @returns Observable emitting the updated diet-meal entry
   */
  updateDietMeal(mealId: string, data: UpdateDietMealInput): Observable<DietMeal> {
    return this.http.patch<DietMeal>(`${this.apiUrl}/meals/${mealId}`, data);
  }

  /**
   * Removes a meal from a dietary plan.
   * @param mealId - The ID of the diet-meal entry to remove
   * @returns Observable emitting void on success
   */
  removeMealFromDiet(mealId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/meals/${mealId}`);
  }

  /**
   * Reorders multiple meals within a dietary plan.
   * @param dietId - The ID of the diet to reorder meals in
   * @param data - Selection and new ordering for meals
   * @returns Observable emitting the updated diet plan
   */
  reorderDietMeals(dietId: string, data: ReorderDietMealsInput): Observable<Diet> {
    return this.http.post<Diet>(`${this.apiUrl}/${dietId}/reorder`, data);
  }
}


