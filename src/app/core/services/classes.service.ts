import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { CreateClassInput, GymClass, UpdateClassInput } from '../models/class';

@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/classes`;

  /**
   * Lista todas las clases de gimnasio disponibles.
   */
  listClasses(): Observable<GymClass[]> {
    return this.http.get<GymClass[]>(this.apiUrl);
  }

  /**
   * Obtiene una clase por su ID.
   */
  getClass(id: string): Observable<GymClass> {
    return this.http.get<GymClass>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva clase.
   */
  createClass(data: CreateClassInput): Observable<GymClass> {
    return this.http.post<GymClass>(this.apiUrl, data);
  }

  /**
   * Actualiza una clase existente.
   */
  updateClass(id: string, data: UpdateClassInput): Observable<GymClass> {
    return this.http.patch<GymClass>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina una clase.
   */
  deleteClass(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}


