import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ticket, CreateTicketInput, UpdateTicketInput } from '../models/ticket';

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
  /** Injected HttpClient for API requests */
  private http = inject(HttpClient);
  /** Base API URL for ticket operations */
  private apiUrl = `${environment.apiUrl}/tickets`;

  /**
   * Creates a new contact ticket (public, no authentication required).
   * Supports file attachments via FormData.
   * @param data - Input data for the new ticket
   * @param files - Optional: array of files to attach to the ticket
   * @returns Observable emitting the created ticket
   */
  createTicket(data: CreateTicketInput, files?: File[]): Observable<Ticket> {
    const formData = new FormData();
    
    // Agregar datos del formulario
    formData.append('name', data.name);
    formData.append('email', data.email);
    if (data.phone) {
      formData.append('phone', data.phone);
    }
    formData.append('centerId', data.centerId);
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    
    // Agregar archivos
    if (files && files.length > 0) {
      for (const file of files) {
        formData.append('attachments', file);
      }
    }

    return this.http.post<Ticket>(this.apiUrl, formData);
  }

  /**
   * Lists all tickets in the system.
   * Requires authentication (typically for Admin roles).
   * @returns Observable emitting an array of tickets
   */
  listTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  /**
   * Retrieves a specific ticket by its ID.
   * @param id - The ID of the ticket to fetch
   * @returns Observable emitting the ticket object
   */
  getTicket(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  /**
   * Updates an existing ticket's information.
   * @param id - The ID of the ticket to update
   * @param data - The updated ticket data
   * @returns Observable emitting the updated ticket
   */
  updateTicket(id: string, data: UpdateTicketInput): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes a ticket by its ID.
   * @param id - The ID of the ticket to delete
   * @returns Observable emitting void on success
   */
  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}


