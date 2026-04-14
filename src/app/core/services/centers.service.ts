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
/**
 * Service for managing training centers and their metadata.
 * Provides functionality for listing, retrieving, and performing administrative 
 * operations (create/update/delete) on gym centers.
 */
@Injectable({
  providedIn: 'root'
})
export class CentersService {
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for center operations */
  private apiUrl = `${environment.apiUrl}/centers`;

  /**
   * Lists all training centers.
   * Permissions vary by role (SUPERADMIN/ADMIN_CENTER see IDs, others see names only).
   * @returns Observable emitting an array of centers
   */
  listCenters(): Observable<Center[]> {
    return this.http.get<Center[]>(this.apiUrl);
  }

  /**
   * Lists all centers with their IDs exposed.
   * Accessible to all authenticated users; typically used for registration and trainer filters.
   * @returns Observable emitting an array of centers with IDs
   */
  listCentersWithIds(): Observable<Center[]> {
    return this.http.get<Center[]>(`${this.apiUrl}/with-ids`);
  }

  /**
   * Retrieves a specific center by its ID.
   * Accessible only to ADMIN_CENTER and SUPERADMIN.
   * @param id - The ID of the center to fetch
   * @returns Observable emitting the center object
   */
  getCenter(id: string): Observable<Center> {
    return this.http.get<Center>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new training center.
   * Accessible only to SUPERADMIN.
   * @param data - Input data for the new center
   * @returns Observable emitting the created center
   */
  createCenter(data: CreateCenterInput): Observable<Center> {
    return this.http.post<Center>(this.apiUrl, data);
  }

  /**
   * Updates an existing training center's information.
   * Accessible only to SUPERADMIN.
   * @param id - The ID of the center to update
   * @param data - The updated center data
   * @returns Observable emitting the updated center
   */
  updateCenter(id: string, data: UpdateCenterInput): Observable<Center> {
    return this.http.patch<Center>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes a training center from the system.
   * Accessible only to SUPERADMIN.
   * @param id - The ID of the center to delete
   * @returns Observable emitting void on success
   */
  deleteCenter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}


