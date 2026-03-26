import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClassesService } from '../../core/services/classes.service';
import { CentersService } from '../../core/services/centers.service';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { GymClass, CreateClassInput, ClassCenterSchedule } from '../../core/models/class';
import { Center } from '../../core/models/center';
import { User } from '../../core/models/user';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-clases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    TranslateModule,
    NavbarComponent
  ],
  templateUrl: './clases.component.html',
  styleUrl: './clases.component.scss'
})
export class ClasesComponent implements OnInit {
  private classesService = inject(ClassesService);
  private centersService = inject(CentersService);
  private usersService = inject(UsersService);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);

  classes = signal<GymClass[]>([]);
  centers = signal<Center[]>([]);
  trainers = signal<User[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  filterName = signal<string>('');
  filterDescription = signal<string>('');
  filterCenterId = signal<string>('');
  showFilters = signal(false);

  showFormModal = signal(false);
  showDeleteModal = signal(false);
  isEditing = signal(false);
  selectedClass = signal<GymClass | null>(null);

  formName = '';
  formDescription = '';
  formTrainerIds = signal<string[]>([]);
  formSchedules = signal<Array<{
    id?: string;
    centerId?: string; // Opcional porque cuando se agrega desde el modal de centro, el centerId viene del selectedCenterForAdd
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>>([]);
  
  // Campos para agregar nuevo horario
  newScheduleCenterId = '';
  newScheduleDayOfWeek = 0; // Lunes por defecto
  newScheduleStartTime = '09:00';
  newScheduleEndTime = '10:00';

  currentUser = computed(() => this.auth.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  canEdit = computed(() => this.isSuperAdmin() || this.isAdminCenter());

  filteredClasses = computed(() => {
    let list = this.classes();

    if (this.filterName()) {
      const term = this.filterName().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(term));
    }

    if (this.filterDescription()) {
      const term = this.filterDescription().toLowerCase();
      list = list.filter(c => (c.description || '').toLowerCase().includes(term));
    }

    // El filtro por centro se hace en el backend, así que aquí solo filtramos por nombre y descripción

    return list;
  });

  hasActiveFilters = computed(() => {
    return !!(this.filterName() || this.filterDescription());
  });

  ngOnInit(): void {
    this.loadClasses();
    this.loadCenters();
    this.loadTrainers();
  }

  loadTrainers(): void {
    this.usersService.listTrainers().subscribe({
      next: (data) => {
        this.trainers.set(data);
      },
      error: (error) => {
        console.error('Error al cargar entrenadores:', error);
      }
    });
  }

  loadClasses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const centerId = this.filterCenterId() || null;
    this.classesService.listClasses(centerId).subscribe({
      next: (data) => {
        this.classes.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('classes.errors.load'));
        this.isLoading.set(false);
      }
    });
  }

  loadCenters(): void {
    this.centersService.listCentersWithIds().subscribe({
      next: (data) => {
        this.centers.set(data);
        
        // Seleccionar el centro favorito del usuario por defecto
        if (!this.filterCenterId() && data.length > 0) {
          const userFavoriteCenterId = this.currentUser()?.favoriteCenterId;
          if (userFavoriteCenterId && data.find(c => c.id === userFavoriteCenterId)) {
            this.filterCenterId.set(userFavoriteCenterId);
          } else if (data.length > 0) {
            this.filterCenterId.set(data[0].id || '');
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
    this.loadClasses(); // Recargar clases con el nuevo filtro
  }

  getCenterName(centerId?: string | null): string {
    if (!centerId) return this.translate.instant('classes.allCenters');
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || this.translate.instant('classes.centerNotFound');
  }

  getDayName(dayOfWeek: number): string {
    const days = ['classes.monday', 'classes.tuesday', 'classes.wednesday', 'classes.thursday', 'classes.friday', 'classes.saturday', 'classes.sunday'];
    return this.translate.instant(days[dayOfWeek] || 'classes.unknownDay');
  }

  getSchedulesForCenter(classItem: GymClass, centerId?: string): any[] {
    if (!classItem.schedules) return [];
    if (!centerId) return classItem.schedules;
    return classItem.schedules.filter(s => s.centerId === centerId);
  }

  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters(): void {
    this.filterName.set('');
    this.filterDescription.set('');
    // No limpiar el filtro de centro, mantener el seleccionado
  }

  showAddCenterModal = signal(false);
  selectedCenterForAdd = signal<string>('');
  centerTrainers = signal<User[]>([]);

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedClass.set(null);
    this.formName = '';
    this.formDescription = '';
    this.showFormModal.set(true);
    this.errorMessage.set('');
  }

  openAddCenterModal(): void {
    // Para cuando se abre desde el modal de edición
    if (!this.selectedClass()) {
      this.errorMessage.set(this.translate.instant('classes.errors.classNotFound'));
      return;
    }
    this.selectedCenterForAdd.set('');
    this.centerTrainers.set([]);
    this.formTrainerIds.set([]);
    this.formSchedules.set([]);
    this.newScheduleDayOfWeek = 0;
    this.newScheduleStartTime = '09:00';
    this.newScheduleEndTime = '10:00';
    this.showAddCenterModal.set(true);
    this.errorMessage.set('');
  }

  openAddCenterModalForClass(item: GymClass): void {
    // Para cuando se abre desde la tarjeta de la clase
    this.selectedClass.set(item);
    this.selectedCenterForAdd.set('');
    this.centerTrainers.set([]);
    this.formTrainerIds.set([]);
    this.formSchedules.set([]);
    this.newScheduleDayOfWeek = 0;
    this.newScheduleStartTime = '09:00';
    this.newScheduleEndTime = '10:00';
    this.showAddCenterModal.set(true);
    this.errorMessage.set('');
  }

  closeAddCenterModal(): void {
    this.showAddCenterModal.set(false);
    this.selectedCenterForAdd.set('');
    this.centerTrainers.set([]);
    this.formTrainerIds.set([]);
    this.formSchedules.set([]);
  }

  onCenterSelectedForAdd(centerId: string): void {
    this.selectedCenterForAdd.set(centerId);
    // Cargar entrenadores de este centro
    this.usersService.listTrainers(centerId).subscribe({
      next: (trainers) => {
        this.centerTrainers.set(trainers);
      },
      error: (error) => {
        console.error('Error al cargar entrenadores:', error);
        this.errorMessage.set(this.translate.instant('classes.errors.loadTrainers'));
      }
    });
  }

  addCenterToClass(): void {
    if (!this.selectedCenterForAdd()) {
      this.errorMessage.set(this.translate.instant('classes.errors.centerRequired'));
      return;
    }

    if (this.formTrainerIds().length === 0) {
      this.errorMessage.set(this.translate.instant('classes.errors.trainerRequired'));
      return;
    }

    if (this.formSchedules().length === 0) {
      this.errorMessage.set(this.translate.instant('classes.errors.scheduleRequired'));
      return;
    }

    const classId = this.selectedClass()?.id;
    if (!classId) {
      this.errorMessage.set(this.translate.instant('classes.errors.classNotFound'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const data = {
      centerId: this.selectedCenterForAdd(),
      trainerIds: this.formTrainerIds(),
      schedules: this.formSchedules().map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime
      })).filter(s => s.dayOfWeek !== undefined && s.startTime && s.endTime)
    };

    this.classesService.addCenterToClass(classId, data).subscribe({
      next: (updatedClass) => {
        this.selectedClass.set(updatedClass);
        this.isLoading.set(false);
        this.closeAddCenterModal();
        this.loadClasses(); // Recargar lista
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('classes.errors.save'));
        this.isLoading.set(false);
      }
    });
  }

  openEditModal(item: GymClass): void {
    this.isEditing.set(true);
    this.selectedClass.set(item);
    this.formName = item.name;
    this.formDescription = item.description || '';
    
    // Cargar entrenadores de la clase
    const trainerIds = item.trainers?.map(t => t.trainerId) || [];
    this.formTrainerIds.set(trainerIds);
    
    // Cargar horarios de la clase
    const schedules = item.schedules?.map(s => ({
      id: s.id,
      centerId: s.centerId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime
    })) || [];
    this.formSchedules.set(schedules);
    
    // Inicializar campos de nuevo horario
    this.newScheduleCenterId = '';
    this.newScheduleDayOfWeek = 0;
    this.newScheduleStartTime = '09:00';
    this.newScheduleEndTime = '10:00';
    
    this.showFormModal.set(true);
    this.errorMessage.set('');
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.errorMessage.set('');
    this.formTrainerIds.set([]);
    this.formSchedules.set([]);
  }

  openDeleteModal(item: GymClass): void {
    this.selectedClass.set(item);
    this.showDeleteModal.set(true);
    this.errorMessage.set('');
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedClass.set(null);
    this.errorMessage.set('');
  }

  addSchedule(): void {
    if (!this.selectedCenterForAdd()) {
      this.errorMessage.set(this.translate.instant('classes.errors.centerRequired'));
      return;
    }
    if (!this.newScheduleStartTime || !this.newScheduleEndTime) {
      this.errorMessage.set(this.translate.instant('classes.errors.timeRequired'));
      return;
    }

    const newSchedule = {
      dayOfWeek: this.newScheduleDayOfWeek,
      startTime: this.newScheduleStartTime,
      endTime: this.newScheduleEndTime
    };

    this.formSchedules.set([...this.formSchedules(), newSchedule]);
    
    // Resetear campos
    this.newScheduleDayOfWeek = 0;
    this.newScheduleStartTime = '09:00';
    this.newScheduleEndTime = '10:00';
    this.errorMessage.set('');
  }

  removeSchedule(index: number): void {
    const schedules = this.formSchedules();
    schedules.splice(index, 1);
    this.formSchedules.set([...schedules]);
  }

  toggleTrainer(trainerId: string): void {
    const currentIds = this.formTrainerIds();
    if (currentIds.includes(trainerId)) {
      this.formTrainerIds.set(currentIds.filter(id => id !== trainerId));
    } else {
      this.formTrainerIds.set([...currentIds, trainerId]);
    }
  }

  isTrainerSelected(trainerId: string): boolean {
    return this.formTrainerIds().includes(trainerId);
  }

  onSubmit(): void {
    if (!this.formName.trim()) {
      this.errorMessage.set(this.translate.instant('classes.errors.nameRequired'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const data: CreateClassInput = {
      name: this.formName.trim(),
      description: this.formDescription?.trim() || undefined
    };

    if (this.isEditing() && this.selectedClass()) {
      const id = this.selectedClass()!.id;
      this.classesService.updateClass(id, data).subscribe({
        next: () => this.finishAction(),
        error: (error) => {
          this.errorMessage.set(error.error?.message || this.translate.instant('classes.errors.save'));
          this.isLoading.set(false);
        }
      });
    } else {
      this.classesService.createClass(data).subscribe({
        next: (createdClass) => {
          this.selectedClass.set(createdClass);
          this.isEditing.set(true);
          this.isLoading.set(false);
          // No cerrar el modal, mostrar el botón para agregar centros
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || this.translate.instant('classes.errors.save'));
          this.isLoading.set(false);
        }
      });
    }
  }

  confirmDelete(): void {
    const item = this.selectedClass();
    if (!item) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.classesService.deleteClass(item.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeDeleteModal();
        this.loadClasses();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al eliminar la clase');
        this.isLoading.set(false);
      }
    });
  }

  private finishAction(): void {
    this.isLoading.set(false);
    this.closeFormModal();
    this.loadClasses();
  }

  getCentersForClass(): Array<{ id: string; name: string }> {
    const classItem = this.selectedClass();
    if (!classItem || !classItem.schedules) return [];
    
    // Obtener centros únicos de los horarios
    const centerMap = new Map<string, { id: string; name: string }>();
    classItem.schedules.forEach(schedule => {
      if (schedule.center && schedule.center.id) {
        centerMap.set(schedule.center.id, {
          id: schedule.center.id,
          name: schedule.center.name
        });
      }
    });
    
    return Array.from(centerMap.values());
  }

  getSchedulesForCenterInClass(centerId: string): ClassCenterSchedule[] {
    const classItem = this.selectedClass();
    if (!classItem || !classItem.schedules) return [];
    return classItem.schedules.filter(s => s.centerId === centerId);
  }

  getTrainersForCenterInClass(centerId: string): any[] {
    const classItem = this.selectedClass();
    if (!classItem || !classItem.trainers) return [];
    
    // Filtrar entrenadores que tienen este centro como favorito
    return classItem.trainers.filter(t => {
      const trainer = this.trainers().find(tr => tr.id === t.trainerId);
      return trainer?.favoriteCenterId === centerId;
    });
  }

  openEditCenterModal(centerId: string): void {
    const center = this.centers().find(c => c.id === centerId);
    if (!center) return;

    // Cargar entrenadores de este centro
    this.usersService.listTrainers(centerId).subscribe({
      next: (trainers) => {
        this.centerTrainers.set(trainers);
        
        // Cargar entrenadores actuales de la clase para este centro
        const currentTrainers = this.getTrainersForCenterInClass(centerId);
        this.formTrainerIds.set(currentTrainers.map(t => t.trainerId));
        
        // Cargar horarios actuales de este centro
        const currentSchedules = this.getSchedulesForCenterInClass(centerId);
        this.formSchedules.set(currentSchedules.map(s => ({
          id: s.id,
          centerId: s.centerId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime
        })));
        
        this.selectedCenterForAdd.set(centerId);
        this.showAddCenterModal.set(true);
        this.errorMessage.set('');
      },
      error: (error) => {
        console.error('Error al cargar entrenadores:', error);
        this.errorMessage.set(this.translate.instant('classes.errors.loadTrainers'));
      }
    });
  }

  deleteCenterFromClass(centerId: string): void {
    const classId = this.selectedClass()?.id;
    if (!classId) {
      this.errorMessage.set(this.translate.instant('classes.errors.classNotFound'));
      return;
    }

    if (!confirm(this.translate.instant('classes.confirmDeleteCenter'))) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.classesService.removeCenterFromClass(classId, centerId).subscribe({
      next: (updatedClass) => {
        this.selectedClass.set(updatedClass);
        this.isLoading.set(false);
        this.loadClasses(); // Recargar lista
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('classes.errors.delete'));
        this.isLoading.set(false);
      }
    });
  }

  saveCenterChanges(): void {
    const classId = this.selectedClass()?.id;
    const centerId = this.selectedCenterForAdd();
    
    if (!classId || !centerId) {
      this.errorMessage.set(this.translate.instant('classes.errors.classNotFound'));
      return;
    }

    if (this.formTrainerIds().length === 0) {
      this.errorMessage.set(this.translate.instant('classes.errors.trainerRequired'));
      return;
    }

    if (this.formSchedules().length === 0) {
      this.errorMessage.set(this.translate.instant('classes.errors.scheduleRequired'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const data = {
      trainerIds: this.formTrainerIds(),
      schedules: this.formSchedules().map(s => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    };

    this.classesService.updateCenterInClass(classId, centerId, data).subscribe({
      next: (updatedClass) => {
        this.selectedClass.set(updatedClass);
        this.isLoading.set(false);
        this.closeAddCenterModal();
        this.loadClasses(); // Recargar lista
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('classes.errors.save'));
        this.isLoading.set(false);
      }
    });
  }

  onAddCenterSubmit(): void {
    this.addCenterToClass();
  }

  isCenterAlreadyInClass(centerId: string): boolean {
    const classItem = this.selectedClass();
    if (!classItem || !classItem.schedules || !centerId) return false;
    return classItem.schedules.some(s => s.centerId === centerId);
  }
}
