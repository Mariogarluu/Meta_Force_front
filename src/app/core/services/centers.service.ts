import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Center, CreateCenterInput, UpdateCenterInput } from '../models/center';

/**
 * Service for managing training centers and their metadata.
 * Provides functionality for listing, retrieving, and performing administrative 
 * operations (create/update/delete) on gym centers.
 */
@Injectable({
  providedIn: 'root'
})
export class CentersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/centers`;

  /**
   * Lista todos los centros de entrenamiento.
   * Los permisos varían según el rol:
   * - USER, TRAINER, CLEANER: Solo ven el nombre de su centro (sin ID)
   * - ADMIN_CENTER: Ven todos los centros con ID
   * - SUPERADMIN: Ven todos los centros con ID
   */
  listCenters(): Observable<Center[]> {
    return this.http.get<Center[]>(this.apiUrl);
  }

  /**
   * Lista todos los centros con IDs.
   * Accesible para todos los usuarios autenticados.
   * Usado principalmente para la página de entrenadores.
   */
  listCentersWithIds(): Observable<Center[]> {
    return this.http.get<Center[]>(`${this.apiUrl}/with-ids`);
  }

  /**
   * Obtiene un centro específico por su ID.
   * Solo accesible para ADMIN_CENTER y SUPERADMIN.
   */
  getCenter(id: string): Observable<Center> {
    return this.http.get<Center>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo centro de entrenamiento.
   * Solo accesible para SUPERADMIN.
   */
  createCenter(data: CreateCenterInput): Observable<Center> {
    return this.http.post<Center>(this.apiUrl, data);
  }

  /**
   * Actualiza un centro existente.
   * Solo accesible para SUPERADMIN.
   */
  updateCenter(id: string, data: UpdateCenterInput): Observable<Center> {
    return this.http.patch<Center>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina un centro de entrenamiento.
   * Solo accesible para SUPERADMIN.
   */
  deleteCenter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

