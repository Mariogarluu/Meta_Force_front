import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateClassInput, GymClass, UpdateClassInput } from '../models/class';

/**
 * Servicio para gestionar las operaciones CRUD de clases de gimnasio.
 * Proporciona métodos para listar, obtener, crear, actualizar y eliminar clases.
 * Todas las operaciones se comunican con el backend mediante HTTP.
 */
@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/classes`;

  /**
   * Obtiene todas las clases de gimnasio disponibles.
   * @param centerId - Opcional: filtra las clases que tienen horarios en este centro
   * @returns Observable que emite un array de clases
   */
  listClasses(centerId?: string | null): Observable<GymClass[]> {
    const params: any = {};
    if (centerId) {
      params.centerId = centerId;
    }
    return this.http.get<GymClass[]>(this.apiUrl, { params });
  }

  /**
   * Obtiene una clase específica por su ID.
   * @param id - El identificador único de la clase
   * @returns Observable que emite la clase encontrada
   */
  getClass(id: string): Observable<GymClass> {
    return this.http.get<GymClass>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva clase de gimnasio.
   * @param data - Los datos de la nueva clase (nombre y descripción opcional)
   * @returns Observable que emite la clase creada con su ID
   */
  createClass(data: CreateClassInput): Observable<GymClass> {
    return this.http.post<GymClass>(this.apiUrl, data);
  }

  /**
   * Actualiza una clase existente.
   * @param id - El identificador único de la clase a actualizar
   * @param data - Los datos parciales a actualizar
   * @returns Observable que emite la clase actualizada
   */
  updateClass(id: string, data: UpdateClassInput): Observable<GymClass> {
    return this.http.patch<GymClass>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina una clase por su ID.
   * @param id - El identificador único de la clase a eliminar
   * @returns Observable que se completa cuando la eliminación es exitosa
   */
  deleteClass(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Agrega un centro a una clase existente con entrenadores y horarios.
   * @param classId - El identificador único de la clase
   * @param data - Datos del centro, entrenadores y horarios
   * @returns Observable que emite la clase actualizada
   */
  addCenterToClass(classId: string, data: {
    centerId: string;
    trainerIds: string[];
    schedules: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  }): Observable<GymClass> {
    return this.http.post<GymClass>(`${this.apiUrl}/${classId}/centers`, data);
  }

  /**
   * Elimina un centro de una clase.
   * @param classId - El identificador único de la clase
   * @param centerId - El identificador único del centro
   * @returns Observable que emite la clase actualizada
   */
  removeCenterFromClass(classId: string, centerId: string): Observable<GymClass> {
    return this.http.delete<GymClass>(`${this.apiUrl}/${classId}/centers/${centerId}`);
  }

  /**
   * Actualiza un centro en una clase (entrenadores y horarios).
   * @param classId - El identificador único de la clase
   * @param centerId - El identificador único del centro
   * @param data - Datos de entrenadores y horarios a actualizar
   * @returns Observable que emite la clase actualizada
   */
  updateCenterInClass(classId: string, centerId: string, data: {
    trainerIds?: string[];
    schedules?: Array<{
      id?: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  }): Observable<GymClass> {
    return this.http.patch<GymClass>(`${this.apiUrl}/${classId}/centers/${centerId}`, data);
  }
}


