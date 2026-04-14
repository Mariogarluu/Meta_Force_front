import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  MachineTypeModel,
  MachineCenterInstance,
  CreateMachineTypeInput,
  UpdateMachineTypeInput,
  AddMachineToCenterInput,
  UpdateMachineInCenterInput,
} from '../models/machine';

/**
 * Service for managing machine types and their physical instances in centers.
 * Handles the catalog of equipment and their distribution across gym locations.
 */
/**
 * Service for managing machine types and their physical instances in centers.
 * Handles the catalog of equipment and their distribution across gym locations.
 */
@Injectable({
  providedIn: 'root'
})
export class MachinesService {
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for machine operations */
  private apiUrl = `${environment.apiUrl}/machines`;

  /**
   * Lists all available machine types, optionally including counts for a specific center.
   * Maps backend 'machines' field to 'instances' for consistency.
   * @param centerId - Optional: filter instances by center ID
   * @returns Observable emitting an array of machine types
   */
  listMachineTypes(centerId?: string | null): Observable<MachineTypeModel[]> {
    let params = new HttpParams();
    if (centerId) {
      params = params.set('centerId', centerId);
    }
    return this.http.get<any[]>(`${this.apiUrl}/types`, { params }).pipe(
      map(data => data.map(item => ({
        ...item,
        instances: item.machines || [] // Mapear 'machines' a 'instances'
      })))
    );
  }

  /**
   * Lists all physical machine instances located in a specific center.
   * @param centerId - The ID of the center to query
   * @returns Observable emitting an array of machine instances
   */
  listMachines(centerId: string): Observable<MachineCenterInstance[]> {
    let params = new HttpParams();
    if (centerId) {
      params = params.set('centerId', centerId);
    }
    return this.http.get<MachineCenterInstance[]>(`${this.apiUrl}`, { params });
  }

  /**
   * Retrieves a specific machine type by its ID, including its center instances.
   * @param id - The ID of the machine type to fetch
   * @returns Observable emitting the machine type object
   */
  getMachineType(id: string): Observable<MachineTypeModel> {
    return this.http.get<any>(`${this.apiUrl}/types/${id}`).pipe(
      map(item => ({
        ...item,
        instances: item.machines || []
      }))
    );
  }

  /**
   * Creates a new machine type record.
   * @param data - Input data for the new machine type
   * @returns Observable emitting the created machine type
   */
  createMachineType(data: CreateMachineTypeInput): Observable<MachineTypeModel> {
    return this.http.post<any>(`${this.apiUrl}/types`, data).pipe(
      map(item => ({
        ...item,
        instances: item.machines || []
      }))
    );
  }

  /**
   * Updates an existing machine type record.
   * @param id - The ID of the machine type to update
   * @param data - The updated data
   * @returns Observable emitting the updated machine type
   */
  updateMachineType(id: string, data: UpdateMachineTypeInput): Observable<MachineTypeModel> {
    return this.http.patch<any>(`${this.apiUrl}/types/${id}`, data).pipe(
      map(item => ({
        ...item,
        instances: item.machines || []
      }))
    );
  }

  /**
   * Deletes a machine type and all its associated physical instances.
   * @param id - The ID of the machine type to delete
   * @returns Observable emitting void on success
   */
  deleteMachineType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/types/${id}`);
  }

  /**
   * Deploys instances of a machine type to a specific center.
   * @param machineTypeId - The type of machine to add
   * @param data - Center ID and number of instances to create
   * @returns Observable emitting the created machine instances
   */
  addMachineToCenter(machineTypeId: string, data: AddMachineToCenterInput): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/types/${machineTypeId}/centers`, data).pipe(
      map(response => {
        // El backend devuelve un array de máquinas creadas
        if (Array.isArray(response)) {
          return response;
        }
        return response;
      })
    );
  }

  /**
   * Updates metadata for a specific physical machine instance in a center.
   * @param machineTypeId - The machine type ID
   * @param centerId - The center ID
   * @param instanceNumber - The specific instance number identifier
   * @param data - Updated instance data (e.g., status, notes)
   * @returns Observable emitting the updated instance
   */
  updateMachineInCenter(machineTypeId: string, centerId: string, instanceNumber: number, data: UpdateMachineInCenterInput): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/types/${machineTypeId}/centers/${centerId}/instances/${instanceNumber}`, data);
  }

  /**
   * Removes a specific physical machine instance from a center.
   * @param machineTypeId - The machine type ID
   * @param centerId - The center ID
   * @param instanceNumber - The specific instance number identifier
   * @returns Observable emitting void on success
   */
  removeMachineFromCenter(machineTypeId: string, centerId: string, instanceNumber: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/types/${machineTypeId}/centers/${centerId}/instances/${instanceNumber}`);
  }
}


