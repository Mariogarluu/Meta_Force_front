import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MembershipPlan,
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
} from '../models/membership';

/**
 * Service for managing membership plans and their associated data.
 * Provides functionality for listing available plans and administrative CRUD operations.
 */
@Injectable({
  providedIn: 'root',
})
export class MembershipsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/memberships`;

  /**
   * Lista todos los planes de membresía.
   * Los usuarios normales solo ven planes activos.
   * SUPERADMIN ve todos los planes (activos e inactivos).
   */
  listMembershipPlans(): Observable<MembershipPlan[]> {
    return this.http.get<MembershipPlan[]>(this.apiUrl);
  }

  /**
   * Obtiene un plan de membresía específico por su ID.
   */
  getMembershipPlan(id: string): Observable<MembershipPlan> {
    return this.http.get<MembershipPlan>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo plan de membresía.
   * Solo accesible para SUPERADMIN.
   */
  createMembershipPlan(data: CreateMembershipPlanInput): Observable<MembershipPlan> {
    return this.http.post<MembershipPlan>(this.apiUrl, data);
  }

  /**
   * Actualiza un plan de membresía existente.
   * Solo accesible para SUPERADMIN.
   */
  updateMembershipPlan(
    id: string,
    data: UpdateMembershipPlanInput
  ): Observable<MembershipPlan> {
    return this.http.patch<MembershipPlan>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina un plan de membresía.
   * Solo accesible para SUPERADMIN.
   */
  deleteMembershipPlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

