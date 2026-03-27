import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateClassInput, GymClass, UpdateClassInput } from '../models/class';

/**
 * Service for managing gym classes, schedules, and center associations.
 * Provides a full set of CRUD operations for classes and handles trainers and schedules.
 */
@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for gym class operations */
  private apiUrl = `${environment.apiUrl}/classes`;

  /**
   * Lists all available gym classes, optionally filtered by center.
   * @param centerId - Optional: filter classes that have schedules in this center
   * @returns Observable emitting an array of gym classes
   */
  listClasses(centerId?: string | null): Observable<GymClass[]> {
    const params: any = {};
    if (centerId) {
      params.centerId = centerId;
    }
    return this.http.get<GymClass[]>(this.apiUrl, { params });
  }

  /**
   * Retrieves a specific gym class by its ID.
   * @param id - The unique identifier of the class
   * @returns Observable emitting the found gym class
   */
  getClass(id: string): Observable<GymClass> {
    return this.http.get<GymClass>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new gym class.
   * @param data - Data for the new class (name and optional description)
   * @returns Observable emitting the created class with its ID
   */
  createClass(data: CreateClassInput): Observable<GymClass> {
    return this.http.post<GymClass>(this.apiUrl, data);
  }

  /**
   * Updates an existing gym class.
   * @param id - The unique identifier of the class to update
   * @param data - Partial data for the update
   * @returns Observable emitting the updated class
   */
  updateClass(id: string, data: UpdateClassInput): Observable<GymClass> {
    return this.http.patch<GymClass>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes a gym class by its ID.
   * @param id - The unique identifier of the class to delete
   * @returns Observable completing when deletion is successful
   */
  deleteClass(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Associate a center with an existing class, including trainers and schedules.
   * @param classId - The unique identifier of the class
   * @param data - Association details (center, trainers, and schedules)
   * @returns Observable emitting the updated class
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
   * Removes a center association from a class.
   * @param classId - The unique identifier of the class
   * @param centerId - The unique identifier of the center to remove
   * @returns Observable emitting the updated class
   */
  removeCenterFromClass(classId: string, centerId: string): Observable<GymClass> {
    return this.http.delete<GymClass>(`${this.apiUrl}/${classId}/centers/${centerId}`);
  }

  /**
   * Updates a center association in a class (trainers and schedules).
   * @param classId - The unique identifier of the class
   * @param centerId - The unique identifier of the center
   * @param data - Updated trainer IDs and/or specific schedules
   * @returns Observable emitting the updated class
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



