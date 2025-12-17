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

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NavbarComponent],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss'
})
export class TicketsComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  private centersService = inject(CentersService);
  private authService = inject(AuthService);
  private errorService = inject(ErrorService);
  translate = inject(TranslateService);

  tickets = signal<Ticket[]>([]);
  isLoading = signal(false);
  selectedTicket = signal<Ticket | null>(null);
  showDetailModal = signal(false);
  showDeleteModal = signal(false);
  
  // Filtros
  filterStatus = signal<string>('');
  filterCenterId = signal<string>('');
  centers = signal<Center[]>([]);

  currentUser = computed(() => this.authService.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');

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

  ngOnInit(): void {
    this.loadTickets();
    if (this.isSuperAdmin()) {
      this.loadCenters();
    }
  }

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

  openDetailModal(ticket: Ticket): void {
    this.selectedTicket.set(ticket);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedTicket.set(null);
  }

  openDeleteModal(ticket: Ticket): void {
    this.selectedTicket.set(ticket);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedTicket.set(null);
  }

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

  getStatusLabel(status: TicketStatus): string {
    return this.translate.instant(`tickets.statuses.${status}`);
  }

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
