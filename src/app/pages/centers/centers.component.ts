import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CentersService } from '../../core/services/centers.service';
import { AuthService } from '../../core/services/auth.service';
import { Center, CreateCenterInput } from '../../core/models/center';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

type RoleType = 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';

@Component({
  selector: 'app-centers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, TranslateModule, NavbarComponent],
  templateUrl: './centers.component.html',
  styleUrl: './centers.component.scss'
})
export class CentersComponent implements OnInit {
  centersService = inject(CentersService);
  auth = inject(AuthService);
  translate = inject(TranslateService);

  centers = signal<Center[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');
  
  // --- ESTADO Y FILTROS ---
  filterName = signal<string>('');
  filterDescription = signal<string>('');
  filterAddress = signal<string>('');
  filterCity = signal<string>('');
  filterCountry = signal<string>('');
  filterPhone = signal<string>('');
  filterEmail = signal<string>('');
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');
  showFilters = signal(false);
  
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
  
  canCreate = computed(() => this.isSuperAdmin());
  canDelete = computed(() => this.isSuperAdmin());

  // --- LÓGICA DE FILTRADO ---
  filteredCenters = computed(() => {
    let filtered = this.centers();
    
    if (this.filterName()) {
      const nameFilter = this.filterName().toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(nameFilter));
    }
    if (this.filterDescription()) {
      const descFilter = this.filterDescription().toLowerCase();
      filtered = filtered.filter(c => c.description?.toLowerCase().includes(descFilter));
    }
    if (this.filterAddress()) {
      const addressFilter = this.filterAddress().toLowerCase();
      filtered = filtered.filter(c => c.address?.toLowerCase().includes(addressFilter));
    }
    if (this.filterCity()) {
      const cityFilter = this.filterCity().toLowerCase();
      filtered = filtered.filter(c => c.city?.toLowerCase().includes(cityFilter));
    }
    if (this.filterCountry()) {
      const countryFilter = this.filterCountry().toLowerCase();
      filtered = filtered.filter(c => c.country?.toLowerCase().includes(countryFilter));
    }
    if (this.filterPhone()) {
      const phoneFilter = this.filterPhone().toLowerCase();
      filtered = filtered.filter(c => c.phone?.toLowerCase().includes(phoneFilter));
    }
    if (this.filterEmail()) {
      const emailFilter = this.filterEmail().toLowerCase();
      filtered = filtered.filter(c => c.email?.toLowerCase().includes(emailFilter));
    }
    
    if (this.filterDateFrom()) {
      const dateFrom = new Date(this.filterDateFrom());
      filtered = filtered.filter(c => {
        if (!c.createdAt) return false;
        return new Date(c.createdAt) >= dateFrom;
      });
    }
    if (this.filterDateTo()) {
      const dateTo = new Date(this.filterDateTo());
      dateTo.setHours(23, 59, 59, 999); 
      filtered = filtered.filter(c => {
        if (!c.createdAt) return false;
        return new Date(c.createdAt) <= dateTo;
      });
    }
    
    return filtered;
  });

  hasActiveFilters = computed(() => {
    return !!(
      this.filterName() || this.filterDescription() || this.filterAddress() ||
      this.filterCity() || this.filterCountry() || this.filterPhone() ||
      this.filterEmail() || this.filterDateFrom() || this.filterDateTo()
    );
  });

  ngOnInit() {
    this.loadCenters();
  }

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
      name: '', description: '', address: '', city: '', country: '', phone: '', email: ''
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
    const formValue = this.centerForm();
    if (!formValue.name.trim()) {
      this.errorMessage.set(this.translate.instant('centers.errors.nameRequired'));
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.centersService.createCenter(formValue).subscribe({
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
    const formValue = this.centerForm();
    if (!center?.id) return;

    if (!formValue.name.trim()) {
      this.errorMessage.set(this.translate.instant('centers.errors.nameRequired'));
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.centersService.updateCenter(center.id, formValue).subscribe({
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
  
  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters() {
    this.filterName.set('');
    this.filterDescription.set('');
    this.filterAddress.set('');
    this.filterCity.set('');
    this.filterCountry.set('');
    this.filterPhone.set('');
    this.filterEmail.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
  }
}