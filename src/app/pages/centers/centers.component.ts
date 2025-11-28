import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CentersService } from '../../core/services/centers.service';
import { AuthService } from '../../core/services/auth.service';
import { Center, CreateCenterInput, UpdateCenterInput } from '../../core/models/center';

@Component({
  selector: 'app-centers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './centers.component.html',
  styleUrl: './centers.component.scss'
})
export class CentersComponent implements OnInit {
  centersService = inject(CentersService);
  auth = inject(AuthService);

  centers = signal<Center[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');
  
  // Modal states
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showViewModal = signal(false);
  
  selectedCenter = signal<Center | null>(null);
  viewCenter = signal<Center | null>(null);
  
  centerForm = signal<CreateCenterInput>({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: ''
  });

  currentUser = computed(() => this.auth.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  
  // Solo SuperAdmin puede crear o borrar
  canCreate = computed(() => this.isSuperAdmin());
  canDelete = computed(() => this.isSuperAdmin());

  ngOnInit() {
    this.loadCenters();
  }

  // Nueva función para verificar si puede editar un centro específico
  canModify(center: Center): boolean {
    if (this.isSuperAdmin()) return true;
    if (this.isAdminCenter()) {
      return center.id === this.currentUser()?.centerId;
    }
    return false;
  }

  loadCenters() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.centersService.listCenters().subscribe({
      next: (data) => {
        this.centers.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al cargar los centros');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal() {
    this.centerForm.set({
      name: '',
      description: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: ''
    });
    this.showCreateModal.set(true);
    this.errorMessage.set('');
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.errorMessage.set('');
  }

  openEditModal(center: Center) {
    if (!center.id) return;
    
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Cargar el centro completo desde el backend
    this.centersService.getCenter(center.id).subscribe({
      next: (fullCenter) => {
        this.selectedCenter.set(fullCenter);
        this.centerForm.set({
          name: fullCenter.name,
          description: fullCenter.description || '',
          address: fullCenter.address || '',
          city: fullCenter.city || '',
          country: fullCenter.country || '',
          phone: fullCenter.phone || '',
          email: fullCenter.email || ''
        });
        this.showEditModal.set(true);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al cargar el centro');
        this.isLoading.set(false);
      }
    });
  }

  openViewModal(center: Center) {
    if (!center.id) {
      this.viewCenter.set(center);
      this.showViewModal.set(true);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.centersService.getCenter(center.id).subscribe({
      next: (fullCenter) => {
        this.viewCenter.set(fullCenter);
        this.showViewModal.set(true);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.viewCenter.set(center);
        this.showViewModal.set(true);
        this.isLoading.set(false);
      }
    });
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.viewCenter.set(null);
    this.errorMessage.set('');
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedCenter.set(null);
    this.errorMessage.set('');
  }

  openDeleteModal(center: Center) {
    this.selectedCenter.set(center);
    this.showDeleteModal.set(true);
    this.errorMessage.set('');
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedCenter.set(null);
    this.errorMessage.set('');
  }

  createCenter() {
    if (!this.centerForm().name.trim()) {
      this.errorMessage.set('El nombre del centro es obligatorio');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.centersService.createCenter(this.centerForm()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeCreateModal();
        this.loadCenters();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al crear el centro');
        this.isLoading.set(false);
      }
    });
  }

  updateCenter() {
    const center = this.selectedCenter();
    if (!center?.id) return;

    if (!this.centerForm().name.trim()) {
      this.errorMessage.set('El nombre del centro es obligatorio');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.centersService.updateCenter(center.id, this.centerForm()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeEditModal();
        this.loadCenters();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al actualizar el centro');
        this.isLoading.set(false);
      }
    });
  }

  deleteCenter() {
    const center = this.selectedCenter();
    if (!center?.id) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.centersService.deleteCenter(center.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeDeleteModal();
        this.loadCenters();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al eliminar el centro');
        this.isLoading.set(false);
      }
    });
  }
}