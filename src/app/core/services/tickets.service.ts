import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Ticket, CreateTicketInput, UpdateTicketInput } from '../models/ticket';
import { SupabaseService } from './supabase.service';

/**
 * Service for managing contact and support tickets.
 * Handles public ticket creation (including file attachments) and authenticated ticket management.
 */
/**
 * Service for managing contact and support tickets.
 * Handles public ticket creation (including file attachments) and authenticated ticket management.
 */
@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private supabase = inject(SupabaseService).client;

  /**
   * Creates a new contact ticket (public, no authentication required).
   * Supports file attachments via FormData.
   * @param data - Input data for the new ticket
   * @param files - Optional: array of files to attach to the ticket
   * @returns Observable emitting the created ticket
   */
  createTicket(data: CreateTicketInput, files?: File[]): Observable<Ticket> {
    // Supabase-native: subimos adjuntos a Storage y guardamos URLs en la tabla Ticket.
    // Nota: con las políticas actuales, requiere usuario autenticado.
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: authData, error: authErr }) => {
        if (authErr || !authData.user) {
          return throwError(() => new Error(authErr?.message || 'Debes iniciar sesión para crear un ticket.'));
        }

        const userId = authData.user.id;
        const uploadFiles = files ?? [];

        const uploads = uploadFiles.map(async (file) => {
          const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
          const path = `${userId}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await this.supabase.storage
            .from('tickets')
            .upload(path, file, { upsert: false });
          if (upErr) throw upErr;
          const { data: urlData } = this.supabase.storage.from('tickets').getPublicUrl(path);
          return urlData.publicUrl;
        });

        return from(Promise.all(uploads));
      }),
      switchMap((attachmentUrls) =>
        from(
          this.supabase
            .from('Ticket')
            .insert({
              name: data.name,
              email: data.email,
              phone: data.phone ?? null,
              centerId: data.centerId,
              subject: data.subject,
              description: data.description,
              attachments: attachmentUrls,
            })
            .select('*')
            .single()
        )
      ),
      map(({ data: created, error }) => {
        if (error) throw error;
        return created as Ticket;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Lists all tickets in the system.
   * Requires authentication (typically for Admin roles).
   * @returns Observable emitting an array of tickets
   */
  listTickets(): Observable<Ticket[]> {
    return from(this.supabase.from('Ticket').select('*').order('createdAt', { ascending: false })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Ticket[];
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Retrieves a specific ticket by its ID.
   * @param id - The ID of the ticket to fetch
   * @returns Observable emitting the ticket object
   */
  getTicket(id: string): Observable<Ticket> {
    return from(this.supabase.from('Ticket').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Ticket;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Updates an existing ticket's information.
   * @param id - The ID of the ticket to update
   * @param data - The updated ticket data
   * @returns Observable emitting the updated ticket
   */
  updateTicket(id: string, data: UpdateTicketInput): Observable<Ticket> {
    return from(this.supabase.from('Ticket').update(data).eq('id', id).select('*').single()).pipe(
      map(({ data: updated, error }) => {
        if (error) throw error;
        return updated as Ticket;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Deletes a ticket by its ID.
   * @param id - The ID of the ticket to delete
   * @returns Observable emitting void on success
   */
  deleteTicket(id: string): Observable<void> {
    return from(this.supabase.from('Ticket').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }
}


