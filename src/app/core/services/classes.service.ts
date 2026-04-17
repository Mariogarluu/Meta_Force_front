import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CreateClassInput, GymClass, UpdateClassInput } from '../models/class';
import { SupabaseService } from './supabase.service';

/**
 * Service for managing gym classes, schedules, and center associations.
 * Provides a full set of CRUD operations for classes and handles trainers and schedules.
 */
@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  private supabase = inject(SupabaseService).client;

  /**
   * Lists all available gym classes, optionally filtered by center.
   * @param centerId - Optional: filter classes that have schedules in this center
   * @returns Observable emitting an array of gym classes
   */
  listClasses(centerId?: string | null): Observable<GymClass[]> {
    // We return classes; if centerId is provided, filter by schedule center.
    const query = centerId
      ? this.supabase
          .from('GymClass')
          .select('*, ClassCenterSchedule!inner(*)')
          .eq('ClassCenterSchedule.centerId', centerId)
      : this.supabase.from('GymClass').select('*');

    return from(query.order('name', { ascending: true })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as GymClass[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Retrieves a specific gym class by its ID.
   * @param id - The unique identifier of the class
   * @returns Observable emitting the found gym class
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
        return data as GymClass;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Creates a new gym class.
   * @param data - Data for the new class (name and optional description)
   * @returns Observable emitting the created class with its ID
   */
  createClass(data: CreateClassInput): Observable<GymClass> {
    return from(this.supabase.from('GymClass').insert(data).select('*').single()).pipe(
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as GymClass;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates an existing gym class.
   * @param id - The unique identifier of the class to update
   * @param data - Partial data for the update
   * @returns Observable emitting the updated class
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
   * Deletes a gym class by its ID.
   * @param id - The unique identifier of the class to delete
   * @returns Observable completing when deletion is successful
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
   * Associate a center with an existing class, including trainers and schedules.
   * @param classId - The unique identifier of the class
   * @param data - Association details (center, trainers, and schedules)
   * @returns Observable emitting the updated class
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
        // Trainers
        data.trainerIds?.length
          ? this.supabase
              .from('ClassTrainer')
              .insert(data.trainerIds.map((trainerId) => ({ classId, trainerId })))
          : Promise.resolve({}),
        // Schedules
        data.schedules?.length
          ? this.supabase
              .from('ClassCenterSchedule')
              .insert(
                data.schedules.map((s) => ({
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
   * Removes a center association from a class.
   * @param classId - The unique identifier of the class
   * @param centerId - The unique identifier of the center to remove
   * @returns Observable emitting the updated class
   */
  removeCenterFromClass(classId: string, centerId: string): Observable<GymClass> {
    return from(
      Promise.all([
        this.supabase.from('ClassCenterSchedule').delete().match({ classId, centerId }),
        // Trainers are per class; if you want per-center trainers, model would differ. For now we keep trainers.
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
   * Updates a center association in a class (trainers and schedules).
   * @param classId - The unique identifier of the class
   * @param centerId - The unique identifier of the center
   * @param data - Updated trainer IDs and/or specific schedules
   * @returns Observable emitting the updated class
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
              .insert(data.trainerIds.map((trainerId) => ({ classId, trainerId })));
          }
        }

        if (data.schedules) {
          // Replace schedules for this center+class (simple & deterministic)
          await this.supabase.from('ClassCenterSchedule').delete().match({ classId, centerId });
          if (data.schedules.length) {
            await this.supabase.from('ClassCenterSchedule').insert(
              data.schedules.map((s) => ({
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



