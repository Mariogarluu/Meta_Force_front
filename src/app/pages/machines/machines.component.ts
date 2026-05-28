import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MachinesService } from '../../core/services/machines.service';
import { CentersService } from '../../core/services/centers.service';
import { AuthService } from '../../core/services/auth.service';
import {
  MachineTypeModel,
  MachineCenterInstance,
  CreateMachineTypeInput,
  UpdateMachineTypeInput,
  AddMachineToCenterInput,
  UpdateMachineInCenterInput,
  MachineStatus,
  MachineType,
} from '../../core/models/machine';
import { Center } from '../../core/models/center';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

/**
 * Interface for machine instance with detailed names (for display in instances tab).
 * Extends the base MachineCenterInstance with human-readable type and center names.
 */
interface MachineCenterInstanceWithDetails extends MachineCenterInstance {
  /** The display name of the machine model type */
  machineTypeName: string;
  /** The display name of the center where the machine is located */
  centerName: string;
}

/**
 * Component for managing gym machine models and their specific instances across centers.
 * Supports viewing machines, managing machine types, and assigning quantities to gyms.
 */
@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, NavbarComponent],
  templateUrl: './machines.component.html',
  styleUrl: './machines.component.scss'
})
export class MachinesComponent implements OnInit {
  /** Injected MachinesService for specialized machine operations */
  private machinesService = inject(MachinesService);
  /** Injected CentersService for gym center metadata */
  private centersService = inject(CentersService);
  /** Injected AuthService for permission and user context */
  public auth = inject(AuthService);
  /** Injected TranslateService for I18n strings */
  translate = inject(TranslateService);

  /** Signal containing the global catalog of machine models/types */
  machineTypes = signal<MachineTypeModel[]>([]);
  /** Signal containing the list of gym centers */
  centers = signal<Center[]>([]);
  /** Signal containing specific machine instances (physical hardware) */
  machineInstances = signal<MachineCenterInstance[]>([]);
  /** Signal tracking background API activity */
  isLoading = signal(false);
  /** Signal for displaying primary error messages */
  errorMessage = signal<string>('');
  /** Signal for displaying errors specific to adding/editing center-level machines */
  addCenterErrorMessage = signal<string>('');

  /** Signal for the name filter input */
  filterName = signal<string>('');
  /** Signal for the category/type filter dropdown */
  filterType = signal<string>('');
  /** Signal for the center selection filter */
  filterCenterId = signal<string>('');
  /** Signal for controlling the filter visibility toggle */
  showFilters = signal(false);

  /** Signal for controlling machine type form modal visibility */
  showFormModal = signal(false);
  /** Signal for controlling machine type deletion modal visibility */
  showDeleteModal = signal(false);
  /** Flag determining if the current modal is in edit or create mode */
  isEditing = signal(false);
  /** Signal for the machine type currently being managed in a modal */
  selectedMachineType = signal<MachineTypeModel | null>(null);

  /** Text field for the machine type name in the form */
  formName = '';
  /** Category selector for the machine type in the form */
  formType: MachineType = 'cardio';

  /** Signal for controlling the 'Add to Center' modal visibility */
  showAddCenterModal = signal(false);
  /** Signal for the target center ID when adding instances */
  selectedCenterForAdd = signal<string>('');
  /** Quantity of machines to add in the current operation */
  formQuantity = 1;
  /** Initial or updated status for the machine instances */
  formStatus: MachineStatus = 'operativa';
  
  /** Current active view mode ('models' catalog or specific 'instances' list) */
  activeTab = signal<'models' | 'instances'>('models');
  
  /** Signal tracking which machine types have their instances expanded in the UI */
  expandedMachineTypes = signal<Set<string>>(new Set());

  /** Computed signal for the current user object */
  currentUser = computed(() => this.auth.currentUser());
  /** Computed signal checking if user is SUPERADMIN */
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  /** Computed signal checking if user is ADMIN_CENTER */
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  /** Computed signal for general edit permissions */
  canEdit = computed(() => this.isSuperAdmin() || this.isAdminCenter());

  /** Available machine categories for dropdowns */
  machineTypeOptions: MachineType[] = ['cardio', 'fuerza', 'peso libre', 'funcional', 'otro'];
  /** Available machine statuses for dropdowns */
  machineStatusOptions: MachineStatus[] = ['operativa', 'en mantenimiento', 'fuera de servicio'];

  /** 
   * Computed signal for filtered machine types (global catalog list).
   * Filters by name and type.
   */
  filteredMachineTypes = computed(() => {
    let filtered = this.machineTypes();

    if (this.filterName()) {
      const term = this.filterName().toLowerCase();
      filtered = filtered.filter(m => m.name.toLowerCase().includes(term));
    }

    if (this.filterType()) {
      filtered = filtered.filter(m => m.type === this.filterType());
    }

    // Machine types tab: Do NOT filter by centerId (machine types are global)
    // The centerId filter is only applicable to the instances tab
    return filtered;
  });

  /** Computed signal checking if any search/filter criteria are currently active */
  hasActiveFilters = computed(() => {
    return !!(this.filterName() || this.filterType() || this.filterCenterId());
  });

  /**
   * Initializes the component by fetching models, centers, and existing instances.
   */
  ngOnInit(): void {
    this.loadMachineTypes();
    this.loadCenters();
    this.loadMachineInstances();
  }

  /**
   * Fetches the global catalog of machine models.
   */
  loadMachineTypes(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    // Always get all machine types (they are global)
    // Center filtering is applied at the instance level, not type level
    this.machinesService.listMachineTypes(null).subscribe({
      next: (data) => {
        this.machineTypes.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('machines.errors.load'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Fetches the list of gym centers and establishes default center filters based on user role.
   */
  loadCenters(): void {
    this.centersService.listCentersWithIds().subscribe({
      next: (data) => {
        this.centers.set(data);
        // Para administradores de centro, establecer su centro por defecto
        if (!this.filterCenterId() && data.length > 0) {
          const user = this.currentUser();
          if (this.isAdminCenter() && user?.centerId) {
            // Si es admin de centro, usar su centro
            this.filterCenterId.set(user.centerId);
          } else {
            const userFavoriteCenterId = user?.favoriteCenterId;
            if (userFavoriteCenterId && data.find(c => c.id === userFavoriteCenterId)) {
              this.filterCenterId.set(userFavoriteCenterId);
            } else if (data.length > 0) {
              this.filterCenterId.set(data[0].id || '');
            }
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar centros:', error);
      }
    });
  }

  /**
   * Fetches physical machine instances for the currently selected center.
   */
  loadMachineInstances(): void {
    if (!this.filterCenterId()) {
      this.machineInstances.set([]);
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    // Get all machines for the selected center
    this.machinesService.listMachines(this.filterCenterId()).subscribe({
      next: (machines: MachineCenterInstance[]) => {
        // Transform to include machine type and center names for display
        const instancesWithDetails: MachineCenterInstanceWithDetails[] = machines.map(machine => ({
          ...machine,
          machineTypeName: machine.machineType?.name || 'Desconocido',
          centerName: machine.center?.name || 'Desconocido'
        }));
        
        this.machineInstances.set(instancesWithDetails);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('machines.errors.load'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Reactive callback for when the center filter changes.
   * @param centerId - The new selected center's unique ID
   */
  onCenterChange(centerId: string): void {
    this.filterCenterId.set(centerId);
    this.loadMachineTypes();
  }

  /**
   * Resolves a human-readable center name from an ID.
   * @param centerId - The ID of the center
   * @returns Translated center name or placeholder
   */
  getCenterName(centerId?: string | null): string {
    if (!centerId) return this.translate.instant('machines.allCenters');
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || this.translate.instant('machines.centerNotFound');
  }

  /**
   * Extracts instances belonging to a specific center from a machine type model.
   * @param machineType - The machine type model containing nested instances
   * @param centerId - (Optional) Filter by this center ID
   * @returns Array of matching instances
   */
  getInstancesForCenter(machineType: MachineTypeModel, centerId?: string): MachineCenterInstance[] {
    if (!machineType.instances) return [];
    if (!centerId) return machineType.instances;
    return machineType.instances.filter(i => i.centerId === centerId);
  }

  /**
   * Returns a list of centers that possess at least one instance of a given machine type.
   * @param machineType - The machine type model to analyze
   * @returns Array of Centers that have this machine type
   */
  getCentersForMachineType(machineType: MachineTypeModel): Center[] {
    if (!machineType.instances) return [];
    const uniqueCenterIds = [...new Set(machineType.instances.map(i => i.centerId))];
    return this.centers().filter(c => uniqueCenterIds.includes(c.id || ''));
  }

  /**
   * Checks if a machine type already has presence in a specific center.
   * @param centerId - The ID of the center to check
   * @returns True if at least one instance exists in that center
   */
  isCenterAlreadyInMachineType(centerId: string): boolean {
    return this.selectedMachineType()?.instances?.some(i => i.centerId === centerId) || false;
  }

  /**
   * Toggles the UI filter panel visibility.
   */
  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  /**
   * Resets name and type filters to their default empty states.
   */
  clearFilters(): void {
    this.filterName.set('');
    this.filterType.set('');
    // this.filterCenterId.set(''); // Keep selected center
  }

  /**
   * Prepares and opens the machine type creation modal.
   */
  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedMachineType.set(null);
    this.formName = '';
    this.formType = 'cardio';
    this.showFormModal.set(true);
    this.errorMessage.set(''); // Limpiar error al abrir
    this.addCenterErrorMessage.set(''); // También limpiar el error del otro modal
  }

  /**
   * Prepares and opens the machine type editing modal with prefilled data.
   * @param machineType - The machine type model to edit
   */
  openEditModal(machineType: MachineTypeModel): void {
    this.isEditing.set(true);
    this.selectedMachineType.set(machineType);
    this.formName = machineType.name;
    this.formType = machineType.type;
    this.showFormModal.set(true);
    this.errorMessage.set(''); // Limpiar error al abrir
    this.addCenterErrorMessage.set(''); // También limpiar el error del otro modal
  }

  /**
   * Closes the machine type form modal and resets errors.
   */
  closeFormModal(): void {
    this.showFormModal.set(false);
    this.selectedMachineType.set(null);
    this.errorMessage.set(''); // Limpiar error al cerrar
  }

  /**
   * Opens the confirmation modal for deleting a machine type.
   * @param machineType - The machine type to delete
   */
  openDeleteModal(machineType: MachineTypeModel): void {
    this.selectedMachineType.set(machineType);
    this.showDeleteModal.set(true);
  }

  /**
   * Closes the machine type deletion confirmation modal.
   */
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedMachineType.set(null);
  }

  /**
   * Validates and submits the machine type form (Create or Update).
   */
  onSubmit(): void {
    if (!this.formName.trim()) {
      this.errorMessage.set(this.translate.instant('machines.errors.nameRequired'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Crear objeto limpio solo con name y type - sin status ni otros campos
    // Asegurarse de que solo se envíen estos dos campos
    const data: CreateMachineTypeInput | UpdateMachineTypeInput = {
      name: this.formName.trim(),
      type: this.formType,
    };

    // Verificar que el objeto solo contiene name y type
    const dataKeys = Object.keys(data);
    if (dataKeys.length !== 2 || !dataKeys.includes('name') || !dataKeys.includes('type')) {
      console.error('Error: El objeto de datos contiene campos adicionales:', data);
      this.errorMessage.set('Error: El formulario contiene campos no válidos');
      this.isLoading.set(false);
      return;
    }

    // Log para depuración
    console.log('Creating machine type with data:', JSON.stringify(data));

    if (this.isEditing() && this.selectedMachineType()) {
      const id = this.selectedMachineType()!.id;
      this.machinesService.updateMachineType(id, data as UpdateMachineTypeInput).subscribe({
        next: () => this.finishAction(),
        error: (error) => {
          console.error('Error updating machine type:', error);
          this.errorMessage.set(error.error?.message || this.translate.instant('machines.errors.save'));
          this.isLoading.set(false);
        }
      });
    } else {
      // Asegurarse de que el objeto solo contiene name y type
      // Crear un nuevo objeto limpio para evitar cualquier referencia a otros campos
      const cleanData: CreateMachineTypeInput = {
        name: String(this.formName.trim()),
        type: String(this.formType) as MachineType,
      };
      
      console.log('Sending clean data:', JSON.stringify(cleanData));
      console.log('Data keys:', Object.keys(cleanData));
      
      this.machinesService.createMachineType(cleanData).subscribe({
        next: () => this.finishAction(),
        error: (error) => {
          console.error('Error creating machine type:', error);
          console.error('Error details:', error.error);
          console.error('Request body that was sent:', cleanData);
          this.errorMessage.set(error.error?.message || this.translate.instant('machines.errors.save'));
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Executes the deletion of the selected machine type from the backend.
   */
  confirmDelete(): void {
    const machineType = this.selectedMachineType();
    if (!machineType) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.machinesService.deleteMachineType(machineType.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeDeleteModal();
        this.loadMachineTypes();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('machines.errors.delete'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Opens the modal to assign new machine instances to a gym.
   */
  openAddCenterModal(): void {
    this.selectedMachineType.set(null);
    this.selectedCenterForAdd.set(this.filterCenterId() || '');
    this.formQuantity = 1;
    this.formStatus = 'operativa';
    this.isEditing.set(false);
    this.showAddCenterModal.set(true);
    this.addCenterErrorMessage.set('');
  }

  /**
   * Opens the modal to add machines of a specific model to a center.
   * @param machineType - The target machine model
   */
  openAddCenterModalForMachineType(machineType: MachineTypeModel): void {
    this.selectedMachineType.set(machineType);
    this.selectedCenterForAdd.set('');
    this.formQuantity = 1;
    this.formStatus = 'operativa';
    this.isEditing.set(false);
    this.showAddCenterModal.set(true);
    this.addCenterErrorMessage.set('');
  }

  /**
   * Opens the modal to edit an existing physical machine instance's status.
   * @param machineType - The machine type model
   * @param instance - The specific center instance
   */
  openEditInstanceModal(machineType: MachineTypeModel, instance: MachineCenterInstance): void {
    this.selectedMachineType.set(machineType);
    this.selectedCenterForAdd.set(instance.centerId);
    this.formStatus = instance.status;
    this.showAddCenterModal.set(true);
    this.isEditing.set(true);
    this.addCenterErrorMessage.set('');
  }

  /**
   * Closes the instance management modal.
   */
  closeAddCenterModal(): void {
    this.showAddCenterModal.set(false);
    this.selectedCenterForAdd.set('');
    this.selectedMachineType.set(null);
    this.isEditing.set(false);
    this.addCenterErrorMessage.set('');
  }

  /**
   * Removes a physical machine instance from a center after confirmation.
   * @param machineType - The machine type model
   * @param instance - The specific instance record
   */
  deleteInstanceFromCenter(machineType: MachineTypeModel, instance: MachineCenterInstance): void {
    if (!confirm(this.translate.instant('machines.confirmDeleteInstance'))) return;

    this.isLoading.set(true);
    this.machinesService.removeMachineFromCenter(machineType.id, instance.centerId, instance.instanceNumber).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.loadMachineTypes();
      },
      error: (error) => {
        this.addCenterErrorMessage.set(error.error?.message || this.translate.instant('machines.errors.deleteInstance'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Submits updates to an existing machine instance (e.g., status changes).
   */
  saveInstanceChanges(): void {
    const machineTypeId = this.selectedMachineType()?.id;
    const centerId = this.selectedCenterForAdd();
    const instance = this.selectedMachineType()?.instances?.find(i => i.centerId === centerId);

    if (!machineTypeId || !centerId || !instance) {
      this.addCenterErrorMessage.set(this.translate.instant('machines.errors.instanceNotFound'));
      return;
    }

    this.isLoading.set(true);
    this.addCenterErrorMessage.set('');

    const data: UpdateMachineInCenterInput = {
      status: this.formStatus,
    };

    this.machinesService.updateMachineInCenter(machineTypeId, centerId, instance.instanceNumber, data).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeAddCenterModal();
        this.loadMachineTypes();
      },
      error: (error) => {
        console.error('Error al guardar cambios de máquina:', error);
        this.addCenterErrorMessage.set(error.message || error.error?.message || this.translate.instant('machines.errors.save'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Validates and submits the 'Add Machine to Center' or 'Update Instance' form.
   */
  onAddCenterSubmit(): void {
    if (this.isEditing()) {
      this.saveInstanceChanges();
      return;
    }

    const machineTypeId = this.selectedMachineType()?.id;
    const centerId = this.selectedCenterForAdd();

    if (!machineTypeId || !centerId) {
      this.addCenterErrorMessage.set(this.translate.instant('machines.errors.machineTypeOrCenterRequired'));
      return;
    }

    if (this.formQuantity < 1) {
      this.addCenterErrorMessage.set(this.translate.instant('machines.errors.quantityRequired'));
      return;
    }

    this.isLoading.set(true);
    this.addCenterErrorMessage.set('');

    const data: AddMachineToCenterInput = {
      centerId,
      quantity: this.formQuantity,
      status: this.formStatus || 'operativa',
    };

    this.machinesService.addMachineToCenter(machineTypeId, data).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeAddCenterModal();
        this.loadMachineTypes();
      },
      error: (error) => {
        console.error('Error al agregar máquina al centro:', error);
        this.addCenterErrorMessage.set(error.message || error.error?.message || this.translate.instant('machines.errors.save'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Internal helper to finalize a successful data modification operation.
   */
  private finishAction(): void {
    this.isLoading.set(false);
    this.closeFormModal();
    this.loadMachineTypes();
  }

  /**
   * Returns Tailwind CSS color classes based on the machine status.
   * @param status - The machine's current operational status
   * @returns String of CSS classes
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'operativa': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50';
      case 'en mantenimiento': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50';
      case 'fuera de servicio': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }

  /**
   * Checks if the currently filtered list contains any machines with actual center instances.
   * @returns True if there are instances to display
   */
  hasInstancesInCenter(): boolean {
    return this.filteredMachineTypes().filter(m => m.instances && m.instances.length > 0).length > 0;
  }

  /**
   * Locates a machine type model in the global list by ID.
   * @param id - The ID of the model to find
   * @returns The matching model or null
   */
  findMachineTypeById(id: string | null): MachineTypeModel | null {
    if (!id) return null;
    return this.machineTypes().find(m => m.id === id) || null;
  }

  /**
   * Sets the active machine type selected by the user.
   * @param id - The unique identifier of the machine type
   */
  onMachineTypeSelect(id: string | null): void {
    this.selectedMachineType.set(this.findMachineTypeById(id));
  }

  /**
   * Toggles the UI expansion state of a specific machine type's instance list.
   * @param machineTypeId - The ID of the machine type to toggle
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
   * Checks if a particular machine type is currently expanded in the view.
   * @param machineTypeId - The entity ID
   * @returns True if expanded
   */
  isMachineTypeExpanded(machineTypeId: string): boolean {
    return this.expandedMachineTypes().has(machineTypeId);
  }
}
