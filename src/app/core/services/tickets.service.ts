import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ticket, CreateTicketInput, UpdateTicketInput } from '../models/ticket';

/**
 * Service for managing contact and support tickets.
 * Handles public ticket creation (including file attachments) and authenticated ticket management.
 */
@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tickets`;

  /**
   * Crea un nuevo ticket de contacto (público, sin autenticación)
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
   * Lista todos los tickets (requiere autenticación)
   */
  listTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  /**
   * Obtiene un ticket por ID
   */
  getTicket(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualiza un ticket
   */
  updateTicket(id: string, data: UpdateTicketInput): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina un ticket
   */
  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

