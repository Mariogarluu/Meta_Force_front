import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // <--- IMPORTANTE: Importar esto
import { MachinesService } from '../../core/services/machines.service';
import { CentersService } from '../../core/services/centers.service';
import { AuthService } from '../../core/services/auth.service';
import { CreateMachineInput, Machine, MachineStatus, MachineType, UpdateMachineInput } from '../../core/models/machine';
import { Center } from '../../core/models/center';

@Component({
  selector: 'app-machines',
  standalone: true,
  // AÑADIR RouterModule AQUÍ ABAJO 👇
  imports: [CommonModule, FormsModule, DatePipe, RouterModule], 
  templateUrl: './machines.component.html',
  styleUrl: './machines.component.scss'
})
export class MachinesComponent implements OnInit {
  private machinesService = inject(MachinesService);
  private centersService = inject(CentersService);
  public auth = inject(AuthService);

  // Estados de datos
  machines = signal<Machine[]>([]);
  centers = signal<Center[]>([]);
  isLoading = signal(false);
  
  // Estados de UI
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  isEditing = signal(false);
  
  // Estado del formulario y selección
  selectedMachine = signal<Machine | null>(null);
  
  // Valores iniciales del formulario
  private initialFormState: CreateMachineInput = {
    name: '',
    type: 'cardio',
    status: 'operativa',
    centerId: ''
  };

  formState = signal<CreateMachineInput>({ ...this.initialFormState });

  // Computados
  currentUser = computed(() => this.auth.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  
  // Opciones para selects
  machineTypes: MachineType[] = ['cardio', 'fuerza', 'peso libre', 'funcional', 'otro'];
  machineStatuses: MachineStatus[] = ['operativa', 'en mantenimiento', 'fuera de servicio'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    
    const user = this.currentUser();
    if (!user) return;

    const machines$ = this.isSuperAdmin() 
      ? this.machinesService.listMachines()
      : this.machinesService.listMachinesByCenter(user.centerId!);

    machines$.subscribe({
      next: (data) => {
        this.machines.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando máquinas', err);
        this.isLoading.set(false);
      }
    });

    if (this.isSuperAdmin()) {
      this.centersService.listCenters().subscribe({
        next: (data) => this.centers.set(data)
      });
    }
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.selectedMachine.set(null);
    
    const user = this.currentUser();
    const defaultCenterId = !this.isSuperAdmin() && user?.centerId ? user.centerId : '';

    this.formState.set({ 
      ...this.initialFormState,
      centerId: defaultCenterId
    });
    
    this.showFormModal.set(true);
  }

  openEditModal(machine: Machine) {
    this.isEditing.set(true);
    this.selectedMachine.set(machine);
    
    this.formState.set({
      name: machine.name,
      type: machine.type,
      status: machine.status,
      centerId: machine.centerId
    });
    
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
  }

  openDeleteModal(machine: Machine) {
    this.selectedMachine.set(machine);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedMachine.set(null);
  }

  onSubmit() {
    this.isLoading.set(true);
    const formData = this.formState();

    if (this.isEditing() && this.selectedMachine()) {
      const id = this.selectedMachine()!.id;
      const updateData: UpdateMachineInput = { ...formData };
      
      this.machinesService.updateMachine(id, updateData).subscribe({
        next: () => {
          this.finishAction();
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
        }
      });
    } else {
      this.machinesService.createMachine(formData).subscribe({
        next: () => {
          this.finishAction();
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
        }
      });
    }
  }

  confirmDelete() {
    const machine = this.selectedMachine();
    if (!machine) return;

    this.isLoading.set(true);
    this.machinesService.deleteMachine(machine.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeDeleteModal();
        this.loadData();
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  private finishAction() {
    this.isLoading.set(false);
    this.closeFormModal();
    this.loadData();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'operativa': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'en mantenimiento': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'fuera de servicio': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }
}