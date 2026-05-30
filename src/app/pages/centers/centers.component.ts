import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CentersService } from '../../core/services/centers.service';
import { MachinesService } from '../../core/services/machines.service';
import { AuthService } from '../../core/services/auth.service';
import { Center, CreateCenterInput } from '../../core/models/center';
import { MachineTypeModel, MachineCenterInstance } from '../../core/models/machine';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

/**
 * Type representing the different user roles in the system.
 */
type RoleType = 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';

/**
 * Centers management page component.
 * Allows administrators to view, create, update, and delete gym locations.
 */
@Component({
  selector: 'app-centers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, TranslateModule, NavbarComponent],
  templateUrl: './centers.component.html',
  styleUrl: './centers.component.scss'
})
export class CentersComponent implements OnInit {
  /** Injected CentersService for gym location management */
  centersService = inject(CentersService);
  /** Injected MachinesService for inventory tracking within centers */
  machinesService = inject(MachinesService);
  /** Injected AuthService for user role and permission context */
  auth = inject(AuthService);
  /** Injected TranslateService for UI internationalization */
  translate = inject(TranslateService);

  /** Signal containing the full list of gym centers */
  centers = signal<Center[]>([]);
  /** Signal tracking background API activity for center list loading */
  isLoading = signal(false);
  /** Signal for displaying primary error messages in the UI */
  errorMessage = signal<string>('');
  /** Signal containing machine types present in a specific viewed center */
  machines = signal<MachineTypeModel[]>([]);
  /** Signal tracking background API activity for machine inventory loading */
  isLoadingMachines = signal(false);
  /** Signal tracking which machine types are expanded in the center detail view */
  expandedMachineTypes = signal<Set<string>>(new Set());
  
  /** Signal for the name filter input */
  filterName = signal<string>('');
  /** Signal for the description keyword filter */
  filterDescription = signal<string>('');
  /** Signal for the address filter */
  filterAddress = signal<string>('');
  /** Signal for the city filter dropdown/input */
  filterCity = signal<string>('');
  /** Signal for the country filter */
  filterCountry = signal<string>('');
  /** Signal for the phone number filter */
  filterPhone = signal<string>('');
  /** Signal for the email address filter */
  filterEmail = signal<string>('');
  /** Signal for the starting creation date filter */
  filterDateFrom = signal<string>('');
  /** Signal for the ending creation date filter */
  filterDateTo = signal<string>('');
  /** Signal controlling the visibility of the advanced filter panel */
  showFilters = signal(false);
  
  /** Signal controlling the visibility of the center creation modal */
  showCreateModal = signal(false);
  /** Signal controlling the visibility of the center editing modal */
  showEditModal = signal(false);
  /** Signal controlling the visibility of the center deletion confirmation modal */
  showDeleteModal = signal(false);
  /** Signal controlling the visibility of the detailed center view modal */
  showViewModal = signal(false);
  
  /** Signal storing the center currently being edited or deleted */
  selectedCenter = signal<Center | null>(null);
  /** Signal storing the center currently being viewed in detail */
  viewCenter = signal<Center | null>(null);
  
  /** Signal holding the center creation/update form state */
  centerForm = signal<CreateCenterInput>({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: ''
  });

  /** Computed signal for the currently logged-in user */
  currentUser = computed(() => this.auth.currentUser());
  /** Computed convenience flag for Super Admin status */
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  /** Computed convenience flag for Center Admin status */
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  
  /** Computed signal checking if the user can create new centers */
  canCreate = computed(() => this.isSuperAdmin());
  /** Computed signal checking if the user can delete centers */
  canDelete = computed(() => this.isSuperAdmin());

  /** 
   * Computed signal for the filtered list of centers.
   * Applies cumulative filters based on all active criteria.
   */
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

  /** Computed signal checking if any search/filter criteria are currently active */
  hasActiveFilters = computed(() => {
    return !!(
      this.filterName() || this.filterDescription() || this.filterAddress() ||
      this.filterCity() || this.filterCountry() || this.filterPhone() ||
      this.filterEmail() || this.filterDateFrom() || this.filterDateTo()
    );
  });

  /**
   * Component initialization. Fetches the list of gym centers.
   */
  ngOnInit() {
    this.loadCenters();
  }

  /**
   * Logic to determine if the current user has permission to modify a specific center.
   * @param center - The center entity to check
   * @returns True if modification is permitted
   */
  canModify(center: Center): boolean {
    if (this.isSuperAdmin()) return true;
    if (this.isAdminCenter()) {
      return center.id === this.currentUser()?.centerId;
    }
    return false;
  }

  /**
   * Fetches the complete list of gym centers from the backend.
   */
  loadCenters() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.centersService.listCenters().subscribe({
      next: (data) => {
        this.centers.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar los centros');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Prepares and opens the center creation modal.
   */
  openCreateModal() {
    this.centerForm.set({
      name: '', description: '', address: '', city: '', country: '', phone: '', email: ''
    });
    this.showCreateModal.set(true);
    this.errorMessage.set('');
  }

  /**
   * Closes the center creation modal.
   */
  closeCreateModal() {
    this.showCreateModal.set(false);
    this.errorMessage.set('');
  }

  /**
   * Prepares and opens the center editing modal with prefilled data.
   * @param center - The center entity to edit
   */
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
        this.errorMessage.set(error.message || 'Error al cargar el centro');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Opens the detailed view modal for a gym center.
   * Triggers a load for machine inventory associated with that center.
   * @param center - The center entity to view
   */
  openViewModal(center: Center) {
    if (!center.id) {
      this.viewCenter.set(center);
      this.showViewModal.set(true);
      return;
    }
    const centerId = center.id;
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.centersService.getCenter(centerId).subscribe({
      next: (fullCenter) => {
        this.viewCenter.set(fullCenter);
        this.showViewModal.set(true);
        this.isLoading.set(false);
        this.loadMachinesForCenter(centerId);
      },
      error: (error) => {
        this.viewCenter.set(center);
        this.showViewModal.set(true);
        this.isLoading.set(false);
        this.loadMachinesForCenter(centerId);
      }
    });
  }

  /**
   * Private helper to fetch machines specifically assigned to a single gym center.
   * @param centerId - Unique center identifier
   */
  loadMachinesForCenter(centerId: string) {
    this.isLoadingMachines.set(true);
    this.machinesService.listMachineTypes(centerId).subscribe({
      next: (data) => {
        this.machines.set(data);
        this.isLoadingMachines.set(false);
      },
      error: (error) => {
        console.error('Error al cargar máquinas:', error);
        this.machines.set([]);
        this.isLoadingMachines.set(false);
      }
    });
  }

  /**
   * Closes the detailed view modal and resets its associated state.
   */
  closeViewModal() {
    this.showViewModal.set(false);
    this.viewCenter.set(null);
    this.errorMessage.set('');
    this.machines.set([]);
    this.expandedMachineTypes.set(new Set());
  }

  /**
   * Closes the center editing modal.
   */
  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedCenter.set(null);
    this.errorMessage.set('');
  }

  /**
   * Opens the confirmation modal for center deletion.
   * @param center - The target center to be removed
   */
  openDeleteModal(center: Center) {
    this.selectedCenter.set(center);
    this.showDeleteModal.set(true);
    this.errorMessage.set('');
  }

  /**
   * Closes the center deletion confirmation modal.
   */
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedCenter.set(null);
    this.errorMessage.set('');
  }

  /**
   * Submits the current form data to create a new gym center.
   */
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
        this.errorMessage.set(error.message || 'Error al crear el centro');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Submits the current form data to update an existing gym center.
   */
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
        this.errorMessage.set(error.message || 'Error al actualizar el centro');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Executes the deletion of the selected center from the backend.
   */
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
        this.errorMessage.set(error.message || 'Error al eliminar el centro');
        this.isLoading.set(false);
      }
    });
  }
  
  /**
   * Toggles the visibility of the UI filter panel.
   */
  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  /**
   * Resets all search and date filters to their initial empty states.
   */
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

  /**
   * Toggles the expansion state of a specific machine type model in the detail view.
   * @param machineTypeId - Entity ID
   */
  toggleMachineTypeExpanded(machineTypeId: string): void {
    const expanded = new Set(this.expandedMachineTypes());
    if (expanded.has(machineTypeId)) {
      expanded.delete(machineTypeId);
    } else {
      expanded.add(machineTypeId);
    }
    this.expandedMachineTypes.set(expanded);
  }

  /**
   * UI check to see if a machine type's instances are currently visible.
   * @param machineTypeId - Entity ID
   * @returns True if expanded
   */
  isMachineTypeExpanded(machineTypeId: string): boolean {
    return this.expandedMachineTypes().has(machineTypeId);
  }

  /**
   * Extracts physical machine instances for a specific center from a model type.
   * @param machineType - The machine model catalog entry
   * @param centerId - The context center to filter by
   * @returns Array of instances
   */
  getInstancesForCenter(machineType: MachineTypeModel, centerId: string): MachineCenterInstance[] {
    if (!machineType.instances) return [];
    return machineType.instances.filter(i => i.centerId === centerId);
  }

  /**
   * Maps machine status to Tailwind CSS color classes.
   * @param status - The machine's current operational status
   * @returns String list of CSS classes
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'operativa': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-300 dark:border-green-700',
      'en mantenimiento': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
      'fuera de servicio': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-300 dark:border-red-700'
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
  }
}