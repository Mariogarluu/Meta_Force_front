import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TicketsService } from '../../core/services/tickets.service';
import { AuthService } from '../../core/services/auth.service';
import { CentersService } from '../../core/services/centers.service';
import { ErrorService } from '../../core/services/error.service';
import { Ticket, TicketStatus } from '../../core/models/ticket';
import { Center } from '../../core/models/center';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

/**
 * Component for managing and viewing support tickets.
 * Allows administrators to filter, view details, update status, and delete tickets.
 */
@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NavbarComponent],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss'
})
export class TicketsComponent implements OnInit {
  /** Injected TicketsService for CRUD operations */
  private ticketsService = inject(TicketsService);
  /** Injected CentersService to fetch center list for filtering */
  private centersService = inject(CentersService);
  /** Injected AuthService to check user roles */
  private authService = inject(AuthService);
  /** Injected ErrorService for global error handling */
  private errorService = inject(ErrorService);
  /** Injected TranslateService for I18n labels */
  translate = inject(TranslateService);

  /** Signal containing the list of tickets to display */
  tickets = signal<Ticket[]>([]);
  /** Signal tracking if an operation is in progress */
  isLoading = signal(false);
  /** Signal for the currently selected ticket for viewing/editing */
  selectedTicket = signal<Ticket | null>(null);
  /** Signal for controlling the detail modal visibility */
  showDetailModal = signal(false);
  /** Signal for controlling the deletion confirmation modal visibility */
  showDeleteModal = signal(false);
  
  /** Signal for the status filter value */
  filterStatus = signal<string>('');
  /** Signal for the center filter value */
  filterCenterId = signal<string>('');
  /** Signal containing the available centers for filtering */
  centers = signal<Center[]>([]);

  /** Computed signal for the currently logged-in user */
  currentUser = computed(() => this.authService.currentUser());
  /** Computed signal checking if user is SUPERADMIN */
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  /** Computed signal checking if user is ADMIN_CENTER */
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');

  /** 
   * Computed signal for the filtered list of tickets based on status and center selection.
   */
  filteredTickets = computed(() => {
    let filtered = this.tickets();

    if (this.filterStatus()) {
      filtered = filtered.filter(t => t.status === this.filterStatus());
    }

    if (this.filterCenterId()) {
      filtered = filtered.filter(t => t.centerId === this.filterCenterId());
    }

    return filtered;
  });

  /**
   * Initializes the component by loading tickets and available filter options.
   */
  ngOnInit(): void {
    this.loadTickets();
    if (this.isSuperAdmin()) {
      this.loadCenters();
    }
  }

  /**
   * Fetches the list of centers for filtering purposes.
   */
  loadCenters(): void {
    this.centersService.listCentersWithIds().subscribe({
      next: (data) => {
        this.centers.set(data);
      },
      error: (error) => {
        // Solo log si no es error de conexión
        if (error.status !== 0) {
          console.error('Error al cargar centros:', error);
        }
      }
    });
  }

  /**
   * Fetches all support tickets from the service.
   */
  loadTickets(): void {
    this.isLoading.set(true);
    this.ticketsService.listTickets().subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorService.handleError(error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Opens the detail modal for a specific ticket.
   * @param ticket - The ticket object to view
   */
  openDetailModal(ticket: Ticket): void {
    this.selectedTicket.set(ticket);
    this.showDetailModal.set(true);
  }

  /**
   * Closes the detail modal and clears the selection.
   */
  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedTicket.set(null);
  }

  /**
   * Opens the deletion confirmation modal for a specific ticket.
   * @param ticket - The ticket object to delete
   */
  openDeleteModal(ticket: Ticket): void {
    this.selectedTicket.set(ticket);
    this.showDeleteModal.set(true);
  }

  /**
   * Closes the deletion confirmation modal and clears the selection.
   */
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedTicket.set(null);
  }

  /**
   * Updates the status of a specific ticket.
   * @param ticketId - The unique identifier of the ticket
   * @param status - The new status to apply
   */
  updateTicketStatus(ticketId: string, status: TicketStatus): void {
    this.isLoading.set(true);
    this.ticketsService.updateTicket(ticketId, { status }).subscribe({
      next: () => {
        this.loadTickets();
        this.closeDetailModal();
      },
      error: (error) => {
        this.errorService.handleError(error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Permanently deletes the selected ticket from the system.
   */
  deleteTicket(): void {
    const ticket = this.selectedTicket();
    if (!ticket) return;

    this.isLoading.set(true);
    this.ticketsService.deleteTicket(ticket.id).subscribe({
      next: () => {
        this.loadTickets();
        this.closeDeleteModal();
      },
      error: (error) => {
        this.errorService.handleError(error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Returns Tailwind CSS classes for status badges based on the ticket status.
   * @param status - The status of the ticket
   * @returns String containing CSS classes
   */
  getStatusColor(status: TicketStatus): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50';
      case 'completed':
        return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/50';
    }
  }

  /**
   * Returns the translated label for a given ticket status.
   * @param status - The ticket status
   * @returns Translated status string
   */
  getStatusLabel(status: TicketStatus): string {
    return this.translate.instant(`tickets.statuses.${status}`);
  }

  /**
   * Formats an ISO date string into a user-friendly Spanish locale string.
   * @param dateString - The ISO date string
   * @returns Formatted date string
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

