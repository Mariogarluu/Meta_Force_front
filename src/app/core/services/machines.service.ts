import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import {
  MachineTypeModel,
  MachineCenterInstance,
  CreateMachineTypeInput,
  UpdateMachineTypeInput,
  AddMachineToCenterInput,
  UpdateMachineInCenterInput,
} from '../models/machine';
import { SupabaseService } from './supabase.service';

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
  private supabase = inject(SupabaseService).client;

  /**
   * Lists all available machine types, optionally including counts for a specific center.
   * Maps backend 'machines' field to 'instances' for consistency.
   * @param centerId - Optional: filter instances by center ID
   * @returns Observable emitting an array of machine types
   */
  listMachineTypes(centerId?: string | null): Observable<MachineTypeModel[]> {
    const select = centerId
      ? '*, Machine!inner(*)'
      : '*, Machine(*)';

    const query = this.supabase
      .from('MachineType')
      .select(select)
      .order('name', { ascending: true });

    const filtered = centerId ? query.eq('Machine.centerId', centerId) : query;

    return from(filtered).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((item: any) => ({
          ...item,
          instances: item.Machine || [],
        })) as MachineTypeModel[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Lists all physical machine instances located in a specific center.
   * @param centerId - The ID of the center to query
   * @returns Observable emitting an array of machine instances
   */
  listMachines(centerId: string): Observable<MachineCenterInstance[]> {
    return from(
      this.supabase
        .from('Machine')
        .select('*, machineType:MachineType(id,name,type), center:Center(id,name,city)')
        .eq('centerId', centerId)
        .order('machineTypeId', { ascending: true })
        .order('instanceNumber', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as MachineCenterInstance[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Retrieves a specific machine type by its ID, including its center instances.
   * @param id - The ID of the machine type to fetch
   * @returns Observable emitting the machine type object
   */
  getMachineType(id: string): Observable<MachineTypeModel> {
    return from(
      this.supabase
        .from('MachineType')
        .select('*, Machine(*)')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return { ...(data as any), instances: (data as any).Machine || [] } as MachineTypeModel;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Creates a new machine type record.
   * @param data - Input data for the new machine type
   * @returns Observable emitting the created machine type
   */
  createMachineType(data: CreateMachineTypeInput): Observable<MachineTypeModel> {
    return from(this.supabase.from('MachineType').insert(data).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return { ...(created as any), instances: [] } as MachineTypeModel;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates an existing machine type record.
   * @param id - The ID of the machine type to update
   * @param data - The updated data
   * @returns Observable emitting the updated machine type
   */
  updateMachineType(id: string, data: UpdateMachineTypeInput): Observable<MachineTypeModel> {
    return from(this.supabase.from('MachineType').update(data).eq('id', id).select('*').single()).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return from(
          this.supabase
            .from('MachineType')
            .select('*, Machine(*)')
            .eq('id', id)
            .single()
        );
      }),
      map(({ data: reloaded, error }) => {
        if (error) throw error;
        return { ...(reloaded as any), instances: (reloaded as any).Machine || [] } as MachineTypeModel;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deletes a machine type and all its associated physical instances.
   * @param id - The ID of the machine type to delete
   * @returns Observable emitting void on success
   */
  deleteMachineType(id: string): Observable<void> {
    return from(this.supabase.from('MachineType').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deploys instances of a machine type to a specific center.
   * @param machineTypeId - The type of machine to add
   * @param data - Center ID and number of instances to create
   * @returns Observable emitting the created machine instances
   */
  addMachineToCenter(machineTypeId: string, data: AddMachineToCenterInput): Observable<any> {
    const status = data.status ?? 'operativa';
    const quantity = Math.max(1, Math.min(data.quantity, 100));

    return from(
      this.supabase
        .from('Machine')
        .select('instanceNumber')
        .eq('machineTypeId', machineTypeId)
        .eq('centerId', data.centerId)
        .order('instanceNumber', { ascending: false })
        .limit(1)
    ).pipe(
      switchMap(({ data: existing, error }) => {
        if (error) throw error;
        const currentMax = existing?.[0]?.instanceNumber ?? 0;
        const rows = Array.from({ length: quantity }, (_, i) => ({
          machineTypeId,
          centerId: data.centerId,
          instanceNumber: currentMax + i + 1,
          status,
          maxUsers: data.maxUsers ?? null,
        }));
        return from(this.supabase.from('Machine').insert(rows).select('*'));
      }),
      map(({ data: created, error }) => {
        if (error) throw error;
        return created ?? [];
      }),
      catchError(err => throwError(() => new Error(err.message)))
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
    return from(
      this.supabase
        .from('Machine')
        .update(data)
        .match({ machineTypeId, centerId, instanceNumber })
        .select('*')
        .single()
    ).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Removes a specific physical machine instance from a center.
   * @param machineTypeId - The machine type ID
   * @param centerId - The center ID
   * @param instanceNumber - The specific instance number identifier
   * @returns Observable emitting void on success
   */
  removeMachineFromCenter(machineTypeId: string, centerId: string, instanceNumber: number): Observable<void> {
    return from(
      this.supabase.from('Machine').delete().match({ machineTypeId, centerId, instanceNumber })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


