import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Meal, CreateMealInput, UpdateMealInput } from '../models/meal';

@Injectable({
  providedIn: 'root'
})
export class MealsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/meals`;

  listMeals(): Observable<Meal[]> {
    return this.http.get<Meal[]>(this.apiUrl);
  }

  getMeal(id: string): Observable<Meal> {
    return this.http.get<Meal>(`${this.apiUrl}/${id}`);
  }

  createMeal(data: CreateMealInput): Observable<Meal> {
    return this.http.post<Meal>(this.apiUrl, data);
  }

  updateMeal(id: string, data: UpdateMealInput): Observable<Meal> {
    return this.http.patch<Meal>(`${this.apiUrl}/${id}`, data);
  }

  deleteMeal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  importMeals(meals: CreateMealInput[]): Observable<{ created: number; skipped: number; errors: Array<{ meal: string; error: string }> }> {
    return this.http.post<{ created: number; skipped: number; errors: Array<{ meal: string; error: string }> }>(`${this.apiUrl}/import`, { meals });
  }
}

