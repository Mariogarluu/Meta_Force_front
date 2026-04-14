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
/**
 * Service for managing membership plans and their associated data.
 * Provides functionality for listing available plans and administrative CRUD operations.
 */
@Injectable({
  providedIn: 'root',
})
export class MembershipsService {
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for membership operations */
  private apiUrl = `${environment.apiUrl}/memberships`;

  /**
   * Lists all available membership plans.
   * Regular users see active plans only; SUPERADMIN sees both active and inactive plans.
   * @returns Observable emitting an array of membership plans
   */
  listMembershipPlans(): Observable<MembershipPlan[]> {
    return this.http.get<MembershipPlan[]>(this.apiUrl);
  }

  /**
   * Retrieves a specific membership plan by its ID.
   * @param id - The ID of the plan to fetch
   * @returns Observable emitting the membership plan object
   */
  getMembershipPlan(id: string): Observable<MembershipPlan> {
    return this.http.get<MembershipPlan>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new membership plan.
   * Accessible only to SUPERADMIN.
   * @param data - Input data for the new membership plan
   * @returns Observable emitting the created plan
   */
  createMembershipPlan(data: CreateMembershipPlanInput): Observable<MembershipPlan> {
    return this.http.post<MembershipPlan>(this.apiUrl, data);
  }

  /**
   * Updates an existing membership plan.
   * Accessible only to SUPERADMIN.
   * @param id - The ID of the plan to update
   * @param data - The updated plan data
   * @returns Observable emitting the updated plan
   */
  updateMembershipPlan(
    id: string,
    data: UpdateMembershipPlanInput
  ): Observable<MembershipPlan> {
    return this.http.patch<MembershipPlan>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes a membership plan from the system.
   * Accessible only to SUPERADMIN.
   * @param id - The ID of the plan to delete
   * @returns Observable emitting void on success
   */
  deleteMembershipPlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}


