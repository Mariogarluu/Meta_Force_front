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
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/diets`;

  listDiets(userId?: string | null): Observable<Diet[]> {
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    return this.http.get<Diet[]>(this.apiUrl, { params });
  }

  getDiet(id: string): Observable<Diet> {
    return this.http.get<Diet>(`${this.apiUrl}/${id}`);
  }

  createDiet(data: CreateDietInput): Observable<Diet> {
    return this.http.post<Diet>(this.apiUrl, data);
  }

  updateDiet(id: string, data: UpdateDietInput): Observable<Diet> {
    return this.http.patch<Diet>(`${this.apiUrl}/${id}`, data);
  }

  deleteDiet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addMealToDiet(dietId: string, data: AddMealToDietInput): Observable<DietMeal> {
    return this.http.post<DietMeal>(`${this.apiUrl}/${dietId}/meals`, data);
  }

  updateDietMeal(mealId: string, data: UpdateDietMealInput): Observable<DietMeal> {
    return this.http.patch<DietMeal>(`${this.apiUrl}/meals/${mealId}`, data);
  }

  removeMealFromDiet(mealId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/meals/${mealId}`);
  }

  reorderDietMeals(dietId: string, data: ReorderDietMealsInput): Observable<Diet> {
    return this.http.post<Diet>(`${this.apiUrl}/${dietId}/reorder`, data);
  }
}

