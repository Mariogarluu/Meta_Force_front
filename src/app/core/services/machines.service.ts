import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  MachineTypeModel,
  CreateMachineTypeInput,
  UpdateMachineTypeInput,
  AddMachineToCenterInput,
  UpdateMachineInCenterInput,
} from '../models/machine';

@Injectable({
  providedIn: 'root'
})
export class MachinesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/machines`;

  /**
   * Lista todos los tipos de máquinas con sus instancias en centros
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
   * Obtiene un tipo de máquina por ID con sus instancias
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
   * Crea un nuevo tipo de máquina (solo nombre y tipo)
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
   * Actualiza un tipo de máquina
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
   * Elimina un tipo de máquina (y todas sus instancias)
   */
  deleteMachineType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/types/${id}`);
  }

  /**
   * Agrega instancias de un tipo de máquina a un centro
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
   * Actualiza una instancia específica de máquina en un centro
   */
  updateMachineInCenter(machineTypeId: string, centerId: string, instanceNumber: number, data: UpdateMachineInCenterInput): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/types/${machineTypeId}/centers/${centerId}/instances/${instanceNumber}`, data);
  }

  /**
   * Elimina una instancia específica de máquina de un centro
   */
  removeMachineFromCenter(machineTypeId: string, centerId: string, instanceNumber: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/types/${machineTypeId}/centers/${centerId}/instances/${instanceNumber}`);
  }
}

