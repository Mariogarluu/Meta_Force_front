/**
 * =============================================================================
 * SERVICIO DE MAQUINARIA (MACHINES SERVICE)
 * =============================================================================
 * Este servicio gestiona el inventario de tipos de máquinas y las instancias
 * físicas desplegadas en los centros. Controla el catálogo de equipamiento
 * y su estado operativo.
 * 
 * Responsabilidades:
 * 1. Administrar el catálogo global de tipos de máquinas.
 * 2. Gestionar las instancias físicas de maquinaria por sede.
 * 3. Controlar el estado y despliegue de nuevo equipamiento.
 */
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

@Injectable({
  providedIn: 'root'
})
export class MachinesService {
  private supabase = inject(SupabaseService).client;

  /**
   * Lista los tipos de máquinas disponibles, opcionalmente filtrados por centro.
   * @param centerId - Opcional: ID del centro para filtrar los tipos que tienen instancias allí.
   * @returns Observable con el array de modelos de tipos de máquinas.
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
   * Recupera el listado de instancias físicas situadas en un centro específico.
   * @param centerId - ID del centro a consultar.
   * @returns Observable con el array de instancias de maquinaria.
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
   * Obtiene un tipo de máquina específico por su ID, incluyendo sus instancias.
   * @param id - Identificador del tipo de máquina.
   * @returns Observable con el objeto del modelo de tipo de máquina.
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
   * Crea un nuevo registro de tipo de máquina en el catálogo.
   * @param data - Datos iniciales para el tipo de máquina.
   * @returns Observable con el nuevo objeto creado.
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
   * Actualiza la información de un tipo de máquina existente.
   * @param id - ID del tipo de máquina a modificar.
   * @param data - Campos parciales para la actualización.
   * @returns Observable con el objeto actualizado.
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
   * Elimina un tipo de máquina y todas sus instancias asociadas.
   * @param id - ID del tipo de máquina a eliminar.
   * @returns Observable que se completa tras la eliminación.
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
   * Despliega nuevas instancias físicas de un tipo de máquina en un centro.
   * @param machineTypeId - ID del tipo de máquina.
   * @param data - Configuración del despliegue (centro, cantidad, estado inicial).
   * @returns Observable con las instancias recién creadas.
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
   * Actualiza el estado o metadatos de una instancia física específica.
   * @param machineTypeId - ID del tipo de máquina.
   * @param centerId - ID del centro donde se ubica.
   * @param instanceNumber - Número de instancia único dentro de esa sede.
   * @param data - Datos parciales a actualizar (ej: estado, notas).
   * @returns Observable con la instancia actualizada.
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
   * Retira una instancia física específica de un centro.
   * @param machineTypeId - ID del tipo de máquina.
   * @param centerId - ID del centro.
   * @param instanceNumber - Número de instancia a retirar.
   * @returns Observable que se completa tras la retirada.
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


