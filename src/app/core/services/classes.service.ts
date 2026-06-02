/**
 * =============================================================================
 * SERVICIO DE CLASES DIRIGIDAS (CLASSES SERVICE)
 * =============================================================================
 * Este servicio gestiona el catálogo de clases, sus horarios y asociaciones
 * con centros y entrenadores. Permite la administración completa del calendario
 * de actividades del gimnasio.
 * 
 * Responsabilidades:
 * 1. Gestionar el ciclo de vida de las clases dirigidas.
 * 2. Administrar horarios por centro y vinculación de entrenadores.
 * 3. Proporcionar filtros de búsqueda por ubicación geográfica.
 */
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CreateClassInput, GymClass, UpdateClassInput } from '../models/class';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  /** Supabase client used to manage class catalog, schedules and trainer links. */
  private supabase = inject(SupabaseService).client;

  /**
   * Lista las clases disponibles, con opción de filtrar por centro.
   * @param centerId - Opcional: ID del centro para filtrar clases con horario activo allí.
   * @returns Observable con el array de clases encontradas.
   */
  listClasses(centerId?: string | null): Observable<GymClass[]> {
    const query = centerId
      ? this.supabase
          .from('GymClass')
          .select('*, ClassCenterSchedule!inner(*, center:Center(id, name)), ClassTrainer(*, trainer:User(id, name, profileImageUrl))')
          .eq('ClassCenterSchedule.centerId', centerId)
      : this.supabase
          .from('GymClass')
          .select('*, ClassCenterSchedule(*, center:Center(id, name)), ClassTrainer(*, trainer:User(id, name, profileImageUrl))');

    return from(query.order('name', { ascending: true })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as any[];
        return rows.map(row => ({
          ...row,
          schedules: row.ClassCenterSchedule || [],
          trainers: row.ClassTrainer || []
        })) as GymClass[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Recupera una clase específica mediante su identificador.
   * Incluye información de horarios y entrenadores asociados.
   * @param id - Identificador único de la clase.
   * @returns Observable con el objeto de la clase detallado.
   */
  getClass(id: string): Observable<GymClass> {
    return from(
      this.supabase
        .from('GymClass')
        .select('*, ClassCenterSchedule(*), ClassTrainer(*)')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          ...row,
          schedules: row.ClassCenterSchedule || [],
          trainers: row.ClassTrainer || []
        } as GymClass;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Crea una nueva clase en el catálogo global.
   * @param data - Datos básicos de la clase (nombre y descripción opcional).
   * @returns Observable con la clase recién creada.
   */
  createClass(data: CreateClassInput): Observable<GymClass> {
    const payload = {
      id: 'c' + crypto.randomUUID().replace(/-/g, '').substring(0, 24),
      ...data
    };
    return from(this.supabase.from('GymClass').insert(payload).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as GymClass;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Actualiza los datos de una clase existente.
   * @param id - Identificador de la clase a modificar.
   * @param data - Campos parciales para la actualización.
   * @returns Observable con el objeto de la clase actualizado.
   */
  updateClass(id: string, data: UpdateClassInput): Observable<GymClass> {
    return from(this.supabase.from('GymClass').update(data).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as GymClass;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Elimina una clase del catálogo por su ID.
   * @param id - Identificador de la clase a suprimir.
   * @returns Observable que se completa al finalizar la eliminación.
   */
  deleteClass(id: string): Observable<void> {
    return from(this.supabase.from('GymClass').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Asocia una clase a un centro específico definiendo horarios y entrenadores.
   * @param classId - ID de la clase.
   * @param data - Detalles de la asociación (centro, IDs de entrenadores y array de horarios).
   * @returns Observable con la clase actualizada tras la asociación.
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
    return from(
      Promise.all([
        data.trainerIds?.length
          ? this.supabase
              .from('ClassTrainer')
              .insert(
                data.trainerIds.map((trainerId) => ({
                  id: 'c' + crypto.randomUUID().replace(/-/g, '').substring(0, 24),
                  classId,
                  trainerId,
                }))
              )
          : Promise.resolve({}),
        data.schedules?.length
          ? this.supabase
              .from('ClassCenterSchedule')
              .insert(
                data.schedules.map((s) => ({
                  id: 'c' + crypto.randomUUID().replace(/-/g, '').substring(0, 24),
                  classId,
                  centerId: data.centerId,
                  dayOfWeek: s.dayOfWeek,
                  startTime: s.startTime,
                  endTime: s.endTime,
                }))
              )
          : Promise.resolve({}),
      ])
    ).pipe(
      switchMap(() => from(this.supabase.from('GymClass').select('*').eq('id', classId).single())),
      map(({ data: klass, error }) => {
        if (error) throw error;
        return klass as GymClass;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Desvincula una clase de un centro determinado.
   * @param classId - ID de la clase.
   * @param centerId - ID del centro.
   * @returns Observable con el estado de la clase tras la desvinculación.
   */
  removeCenterFromClass(classId: string, centerId: string): Observable<GymClass> {
    return from(
      Promise.all([
        this.supabase.from('ClassCenterSchedule').delete().match({ classId, centerId }),
      ])
    ).pipe(
      switchMap(() => from(this.supabase.from('GymClass').select('*').eq('id', classId).single())),
      map(({ data: klass, error }) => {
        if (error) throw error;
        return klass as GymClass;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Actualiza la configuración de una clase en un centro (entrenadores y horarios).
   * @param classId - ID de la clase.
   * @param centerId - ID del centro.
   * @param data - Nuevos IDs de entrenadores y/o listado completo de horarios.
   * @returns Observable con la clase reflejando los cambios.
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
    return from(
      (async () => {
        if (data.trainerIds) {
          await this.supabase.from('ClassTrainer').delete().eq('classId', classId);
          if (data.trainerIds.length) {
            await this.supabase
              .from('ClassTrainer')
              .insert(
                data.trainerIds.map((trainerId) => ({
                  id: 'c' + crypto.randomUUID().replace(/-/g, '').substring(0, 24),
                  classId,
                  trainerId,
                }))
              );
          }
        }

        if (data.schedules) {
          await this.supabase.from('ClassCenterSchedule').delete().match({ classId, centerId });
          if (data.schedules.length) {
            await this.supabase.from('ClassCenterSchedule').insert(
              data.schedules.map((s) => ({
                id: 'c' + crypto.randomUUID().replace(/-/g, '').substring(0, 24),
                classId,
                centerId,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
              }))
            );
          }
        }
      })()
    ).pipe(
      switchMap(() => from(this.supabase.from('GymClass').select('*').eq('id', classId).single())),
      map(({ data: klass, error }) => {
        if (error) throw error;
        return klass as GymClass;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}



