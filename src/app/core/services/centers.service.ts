/**
 * =============================================================================
 * SERVICIO DE CENTROS (CENTERS SERVICE)
 * =============================================================================
 * Este servicio centraliza la gestión de los centros de entrenamiento (clubes)
 * en el ecosistema Meta-Force. Proporciona métodos para listar, consultar y
 * realizar operaciones administrativas sobre las sedes físicas.
 * 
 * Responsabilidades:
 * 1. Recuperar listados de centros con diferentes niveles de detalle.
 * 2. Gestionar la información atómica de cada sede.
 * 3. Proveer capacidades CRUD para perfiles con privilegios administrativos.
 */
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Center, CreateCenterInput, UpdateCenterInput } from '../models/center';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class CentersService {
  /** Supabase client used to perform all Center‑related queries and mutations. */
  private supabase = inject(SupabaseService).client;

  /**
   * Recupera el listado completo de centros de entrenamiento.
   * El nivel de visibilidad de los datos depende del rol del usuario autenticado.
   * @returns Observable que emite un array de centros ordenados por nombre.
   */
  listCenters(): Observable<Center[]> {
    return from(this.supabase.from('Center').select('*').order('name', { ascending: true })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Center[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Recupera todos los centros exponiendo explícitamente sus IDs únicos.
   * Utilizado comúnmente en formularios de registro y filtros de entrenadores.
   * @returns Observable que emite un array de centros con sus identificadores.
   */
  listCentersWithIds(): Observable<Center[]> {
    return this.listCenters();
  }

  /**
   * Obtiene la información detallada de un centro específico mediante su ID.
   * @param id - Identificador único serial del centro.
   * @returns Observable que emite el objeto del centro solicitado.
   */
  getCenter(id: string): Observable<Center> {
    return from(this.supabase.from('Center').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Center;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Registra un nuevo centro de entrenamiento en el sistema.
   * Operación restringida exclusivamente a roles de SUPERADMIN.
   * @param data - Estructura de datos requerida para el nuevo centro.
   * @returns Observable que emite el objeto del centro recién creado.
   */
  createCenter(data: CreateCenterInput): Observable<Center> {
    const payload = {
      id: 'c' + crypto.randomUUID().replace(/-/g, '').substring(0, 24),
      ...data,
      updatedAt: new Date().toISOString()
    };
    return from(this.supabase.from('Center').insert(payload).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as Center;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Actualiza la información de un centro de entrenamiento existente.
   * Operación restringida exclusivamente a roles de SUPERADMIN.
   * @param id - Identificador único del centro a modificar.
   * @param data - Objeto con los campos parciales a actualizar.
   * @returns Observable que emite el objeto del centro actualizado.
   */
  updateCenter(id: string, data: UpdateCenterInput): Observable<Center> {
    const payload = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    return from(this.supabase.from('Center').update(payload).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as Center;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Elimina de forma lógica o física un centro del ecosistema.
   * Operación de alto riesgo restringida a SUPERADMIN.
   * @param id - Identificador del centro a eliminar.
   * @returns Observable que se completa tras el éxito de la operación.
   */
  deleteCenter(id: string): Observable<void> {
    return from(this.supabase.from('Center').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}


