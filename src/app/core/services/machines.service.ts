import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { CreateMachineInput, Machine, UpdateMachineInput } from '../models/machine';

@Injectable({
  providedIn: 'root'
})
export class MachinesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/machines`;

  /**
   * Lista todas las máquinas del sistema.
   * Uso: Principalmente para SUPERADMIN.
   */
  listMachines(): Observable<Machine[]> {
    return this.http.get<Machine[]>(this.apiUrl);
  }

  /**
   * Lista las máquinas pertenecientes a un centro específico.
   * Uso: Para ADMIN_CENTER (viendo su propio centro) o SUPERADMIN (filtrando).
   */
  listMachinesByCenter(centerId: string): Observable<Machine[]> {
    return this.http.get<Machine[]>(`${this.apiUrl}/center/${centerId}`);
  }

  getMachine(id: string): Observable<Machine> {
    return this.http.get<Machine>(`${this.apiUrl}/${id}`);
  }

  createMachine(data: CreateMachineInput): Observable<Machine> {
    return this.http.post<Machine>(this.apiUrl, data);
  }

  updateMachine(id: string, data: UpdateMachineInput): Observable<Machine> {
    return this.http.patch<Machine>(`${this.apiUrl}/${id}`, data);
  }

  deleteMachine(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}