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

@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, NavbarComponent],
  templateUrl: './machines.component.html',
  styleUrl: './machines.component.scss'
})
export class MachinesComponent implements OnInit {
  private machinesService = inject(MachinesService);
  private centersService = inject(CentersService);
  public auth = inject(AuthService);
  translate = inject(TranslateService);

  machineTypes = signal<MachineTypeModel[]>([]);
  centers = signal<Center[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');
  addCenterErrorMessage = signal<string>(''); 

  // --- FILTROS ---
  filterName = signal<string>('');
  filterType = signal<string>('');
  filterCenterId = signal<string>('');
  showFilters = signal(false);
  // ---------------

  // Modal para crear/editar tipo de máquina
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  isEditing = signal(false);
  selectedMachineType = signal<MachineTypeModel | null>(null);
  formName = '';
  formType: MachineType = 'cardio';

  // Modal para agregar/editar máquina en centro
  showAddCenterModal = signal(false);
  selectedCenterForAdd = signal<string>('');
  formQuantity = 1;
  formStatus: MachineStatus = 'operativa';
  
  // Pestañas para separar Modelos e Instancias
  activeTab = signal<'models' | 'instances'>('models');
  
  // Control de desplegables por tipo de máquina
  expandedMachineTypes = signal<Set<string>>(new Set());

  currentUser = computed(() => this.auth.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  canEdit = computed(() => this.isSuperAdmin() || this.isAdminCenter());

  machineTypeOptions: MachineType[] = ['cardio', 'fuerza', 'peso libre', 'funcional', 'otro'];
  machineStatusOptions: MachineStatus[] = ['operativa', 'en mantenimiento', 'fuera de servicio'];

  // --- LÓGICA DE FILTRADO ---
  filteredMachineTypes = computed(() => {
    let filtered = this.machineTypes();

    if (this.filterName()) {
      const term = this.filterName().toLowerCase();
      filtered = filtered.filter(m => m.name.toLowerCase().includes(term));
    }

    if (this.filterType()) {
      filtered = filtered.filter(m => m.type === this.filterType());
    }

    if (this.filterCenterId()) {
      filtered = filtered.filter(m =>
        m.instances?.some(i => i.centerId === this.filterCenterId())
      );
    }

    return filtered;
  });

  hasActiveFilters = computed(() => {
    return !!(this.filterName() || this.filterType() || this.filterCenterId());
  });

  ngOnInit(): void {
    this.loadMachineTypes();
    this.loadCenters();
  }

  loadMachineTypes(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    // Los administradores de centro deben ver todos los modelos, pero pueden filtrar las instancias por centro
    // Solo pasamos centerId para filtrar las instancias, pero siempre mostramos todos los modelos
    const centerId = this.filterCenterId() || null;
    this.machinesService.listMachineTypes(centerId).subscribe({
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

  onCenterChange(centerId: string): void {
    this.filterCenterId.set(centerId);
    this.loadMachineTypes();
  }

  getCenterName(centerId?: string | null): string {
    if (!centerId) return this.translate.instant('machines.allCenters');
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || this.translate.instant('machines.centerNotFound');
  }

  getInstancesForCenter(machineType: MachineTypeModel, centerId?: string): MachineCenterInstance[] {
    if (!machineType.instances) return [];
    if (!centerId) return machineType.instances;
    return machineType.instances.filter(i => i.centerId === centerId);
  }

  getCentersForMachineType(machineType: MachineTypeModel): Center[] {
    if (!machineType.instances) return [];
    const uniqueCenterIds = [...new Set(machineType.instances.map(i => i.centerId))];
    return this.centers().filter(c => uniqueCenterIds.includes(c.id || ''));
  }

  isCenterAlreadyInMachineType(centerId: string): boolean {
    return this.selectedMachineType()?.instances?.some(i => i.centerId === centerId) || false;
  }

  // --- MÉTODOS DE FILTRO ---
  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters(): void {
    this.filterName.set('');
    this.filterType.set('');
    // this.filterCenterId.set(''); // Keep selected center
  }

  // --- MÉTODOS CRUD TIPO DE MÁQUINA ---
  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedMachineType.set(null);
    this.formName = '';
    this.formType = 'cardio';
    this.showFormModal.set(true);
    this.errorMessage.set(''); // Limpiar error al abrir
    this.addCenterErrorMessage.set(''); // También limpiar el error del otro modal
  }

  openEditModal(machineType: MachineTypeModel): void {
    this.isEditing.set(true);
    this.selectedMachineType.set(machineType);
    this.formName = machineType.name;
    this.formType = machineType.type;
    this.showFormModal.set(true);
    this.errorMessage.set(''); // Limpiar error al abrir
    this.addCenterErrorMessage.set(''); // También limpiar el error del otro modal
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.selectedMachineType.set(null);
    this.errorMessage.set(''); // Limpiar error al cerrar
  }

  openDeleteModal(machineType: MachineTypeModel): void {
    this.selectedMachineType.set(machineType);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedMachineType.set(null);
  }

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

  // --- MÉTODOS PARA AGREGAR/EDITAR MÁQUINA EN CENTRO ---
  openAddCenterModal(): void {
    this.selectedMachineType.set(null);
    this.selectedCenterForAdd.set(this.filterCenterId() || '');
    this.formQuantity = 1;
    this.formStatus = 'operativa';
    this.isEditing.set(false);
    this.showAddCenterModal.set(true);
    this.addCenterErrorMessage.set('');
  }

  openAddCenterModalForMachineType(machineType: MachineTypeModel): void {
    this.selectedMachineType.set(machineType);
    this.selectedCenterForAdd.set('');
    this.formQuantity = 1;
    this.formStatus = 'operativa';
    this.isEditing.set(false);
    this.showAddCenterModal.set(true);
    this.addCenterErrorMessage.set('');
  }

  openEditInstanceModal(machineType: MachineTypeModel, instance: MachineCenterInstance): void {
    this.selectedMachineType.set(machineType);
    this.selectedCenterForAdd.set(instance.centerId);
    this.formStatus = instance.status;
    this.showAddCenterModal.set(true);
    this.isEditing.set(true);
    this.addCenterErrorMessage.set('');
  }

  closeAddCenterModal(): void {
    this.showAddCenterModal.set(false);
    this.selectedCenterForAdd.set('');
    this.selectedMachineType.set(null);
    this.isEditing.set(false);
    this.addCenterErrorMessage.set('');
  }

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
        this.addCenterErrorMessage.set(error.error?.message || this.translate.instant('machines.errors.save'));
        this.isLoading.set(false);
      }
    });
  }

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
        this.addCenterErrorMessage.set(error.error?.message || this.translate.instant('machines.errors.save'));
        this.isLoading.set(false);
      }
    });
  }

  private finishAction(): void {
    this.isLoading.set(false);
    this.closeFormModal();
    this.loadMachineTypes();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'operativa': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50';
      case 'en mantenimiento': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50';
      case 'fuera de servicio': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }

  hasInstancesInCenter(): boolean {
    return this.filteredMachineTypes().filter(m => m.instances && m.instances.length > 0).length > 0;
  }

  findMachineTypeById(id: string | null): MachineTypeModel | null {
    if (!id) return null;
    return this.machineTypes().find(m => m.id === id) || null;
  }

  onMachineTypeSelect(id: string | null): void {
    this.selectedMachineType.set(this.findMachineTypeById(id));
  }

  toggleMachineTypeExpanded(machineTypeId: string): void {
    const expanded = new Set(this.expandedMachineTypes());
    if (expanded.has(machineTypeId)) {
      expanded.delete(machineTypeId);
    } else {
      expanded.add(machineTypeId);
    }
    this.expandedMachineTypes.set(expanded);
  }

  isMachineTypeExpanded(machineTypeId: string): boolean {
    return this.expandedMachineTypes().has(machineTypeId);
  }
}
