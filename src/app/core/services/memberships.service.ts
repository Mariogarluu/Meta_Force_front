import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  MembershipPlan,
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
} from '../models/membership';
import { SupabaseService } from './supabase.service';

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
  /** Supabase client used to manage membership plan records. */
  private supabase = inject(SupabaseService).client;

  /**
   * Lists all available membership plans.
   * Regular users see active plans only; SUPERADMIN sees both active and inactive plans.
   * @returns Observable emitting an array of membership plans
   */
  listMembershipPlans(): Observable<MembershipPlan[]> {
    return from(
      this.supabase
        .from('MembershipPlan')
        .select('*')
        .order('isActive', { ascending: false })
        .order('price', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as MembershipPlan[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Retrieves a specific membership plan by its ID.
   * @param id - The ID of the plan to fetch
   * @returns Observable emitting the membership plan object
   */
  getMembershipPlan(id: string): Observable<MembershipPlan> {
    return from(this.supabase.from('MembershipPlan').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as MembershipPlan;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Creates a new membership plan.
   * Accessible only to SUPERADMIN.
   * @param data - Input data for the new membership plan
   * @returns Observable emitting the created plan
   */
  createMembershipPlan(data: CreateMembershipPlanInput): Observable<MembershipPlan> {
    return from(this.supabase.from('MembershipPlan').insert(data).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as MembershipPlan;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
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
    return from(this.supabase.from('MembershipPlan').update(data).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as MembershipPlan;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deletes a membership plan from the system.
   * Accessible only to SUPERADMIN.
   * @param id - The ID of the plan to delete
   * @returns Observable emitting void on success
   */
  deleteMembershipPlan(id: string): Observable<void> {
    return from(this.supabase.from('MembershipPlan').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


