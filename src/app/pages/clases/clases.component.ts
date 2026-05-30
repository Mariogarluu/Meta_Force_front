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

/**
 * Component for managing scheduled gym classes (e.g., Yoga, HIIT).
 * Handles class metadata, center assignments, trainer associations, and weekly schedules.
 */
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
  /** Injected ClassesService for class and schedule operations */
  private classesService = inject(ClassesService);
  /** Injected CentersService for fetching gym metadata */
  private centersService = inject(CentersService);
  /** Injected UsersService to manage trainer assignments */
  private usersService = inject(UsersService);
  /** Injected AuthService for permission and user context */
  private auth = inject(AuthService);
  /** Injected TranslateService for UI internationalization */
  private translate = inject(TranslateService);

  /** Signal containing the master list of gym classes */
  classes = signal<GymClass[]>([]);
  /** Signal containing the list of available gym centers */
  centers = signal<Center[]>([]);
  /** Signal containing the pool of available personal trainers */
  trainers = signal<User[]>([]);
  /** Signal tracking background API activity */
  isLoading = signal(false);
  /** Signal for displaying primary error messages in the UI */
  errorMessage = signal<string>('');

  /** Signal for the name filter input */
  filterName = signal<string>('');
  /** Signal for the description keyword filter */
  filterDescription = signal<string>('');
  /** Signal for the center selection filter ID */
  filterCenterId = signal<string>('');
  /** Signal controlling the visibility of the search/filter sidebar */
  showFilters = signal(false);

  /** Signal controlling the visibility of the class metadata form modal */
  showFormModal = signal(false);
  /** Signal controlling the visibility of the deletion confirmation modal */
  showDeleteModal = signal(false);
  /** Flag determining if the current class form is in edit or create mode */
  isEditing = signal(false);
  /** Signal storing the class entity currently being managed in a modal */
  selectedClass = signal<GymClass | null>(null);

  /** String field for class name in the form */
  formName = '';
  /** String field for class description in the form */
  formDescription = '';
  /** Signal storing the IDs of trainers assigned to the class in a specific center context */
  formTrainerIds = signal<string[]>([]);
  /** Signal storing the collection of weekly schedules for a class-center association */
  formSchedules = signal<Array<{
    id?: string;
    centerId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>>([]);
  
  /** Target center ID for a new schedule entry */
  newScheduleCenterId = '';
  /** Target day of week for a new schedule entry (0-6) */
  newScheduleDayOfWeek = 0;
  /** Start time string (HH:mm) for a new schedule entry */
  newScheduleStartTime = '09:00';
  /** End time string (HH:mm) for a new schedule entry */
  newScheduleEndTime = '10:00';

  /** Computed signal for the currently logged-in user */
  currentUser = computed(() => this.auth.currentUser());
  /** Computed convenience flag for Super Admin status */
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  /** Computed convenience flag for Center Admin status */
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  /** Computed signal for general edit permissions */
  canEdit = computed(() => this.isSuperAdmin() || this.isAdminCenter());

  /** 
   * Computed signal for filtered gym classes.
   * Filters by name and description keywords.
   */
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

    return list;
  });

  /** Computed signal checking if any search criteria are currently active */
  hasActiveFilters = computed(() => {
    return !!(this.filterName() || this.filterDescription());
  });

  /**
   * Component initialization. Fetches classes, centers, and trainers.
   */
  ngOnInit(): void {
    this.loadClasses();
    this.loadCenters();
    this.loadTrainers();
  }

  /**
   * Fetches the global pool of trainers from the backend.
   */
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

  /**
   * Fetches the list of gym classes, optionally filtered by center.
   */
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
        this.errorMessage.set(error.message || this.translate.instant('classes.errors.load'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Fetches gym centers and establishes default center filters based on context.
   */
  loadCenters(): void {
    this.centersService.listCentersWithIds().subscribe({
      next: (data) => {
        this.centers.set(data);
      },
      error: (error) => {
        console.error('Error al cargar centros:', error);
      }
    });
  }

  /**
   * Reactive callback for when the center filter changes.
   * @param centerId - The new selected center's unique ID
   */
  onCenterChange(centerId: string): void {
    this.filterCenterId.set(centerId);
    this.loadClasses();
  }

  /**
   * Resolves a human-readable center name from an ID.
   * @param centerId - The ID of the center
   * @returns Translated center name or placeholder
   */
  getCenterName(centerId?: string | null): string {
    if (!centerId) return this.translate.instant('classes.allCenters');
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || this.translate.instant('classes.centerNotFound');
  }

  /**
   * Translates a day-of-week index to a human-readable name.
   * @param dayOfWeek - Index (0-6)
   * @returns Translated day name (e.g., 'Monday')
   */
  getDayName(dayOfWeek: number): string {
    const days = ['classes.monday', 'classes.tuesday', 'classes.wednesday', 'classes.thursday', 'classes.friday', 'classes.saturday', 'classes.sunday'];
    return this.translate.instant(days[dayOfWeek] || 'classes.unknownDay');
  }

  /**
   * Extracts schedules belonging to a specific center from a class item.
   * @param classItem - The gym class entity
   * @param centerId - (Optional) Filter by this center ID
   * @returns Array of matching schedules
   */
  getSchedulesForCenter(classItem: GymClass, centerId?: string): any[] {
    if (!classItem.schedules) return [];
    if (!centerId) return classItem.schedules;
    return classItem.schedules.filter(s => s.centerId === centerId);
  }

  /**
   * Toggles the visibility of UI filter panels.
   */
  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  /**
   * Resets name and description filters to empty strings.
   */
  clearFilters(): void {
    this.filterName.set('');
    this.filterDescription.set('');
  }

  /** Signal for controlling the 'Add to Center' modal visibility */
  showAddCenterModal = signal(false);
  /** Signal for the target center ID when assigning a class to a gym */
  selectedCenterForAdd = signal<string>('');
  /** Signal for trainers available in the selected gym center */
  centerTrainers = signal<User[]>([]);

  /**
   * Prepares and opens the class creation modal.
   */
  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedClass.set(null);
    this.formName = '';
    this.formDescription = '';
    this.showFormModal.set(true);
    this.errorMessage.set('');
  }

  /**
   * Opens the centered-assignment modal from the class editor.
   */
  openAddCenterModal(): void {
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

  /**
   * Opens the centered-assignment modal for a specific class item.
   * @param item - The target gym class
   */
  openAddCenterModalForClass(item: GymClass): void {
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

  /**
   * Closes the centered-assignment modal and resets its state.
   */
  closeAddCenterModal(): void {
    this.showAddCenterModal.set(false);
    this.selectedCenterForAdd.set('');
    this.centerTrainers.set([]);
    this.formTrainerIds.set([]);
    this.formSchedules.set([]);
  }

  /**
   * Reactive callback for when the target center for assignment is selected.
   * Fetches trainers associated with that specific gym.
   * @param centerId - The unique center ID
   */
  onCenterSelectedForAdd(centerId: string): void {
    this.selectedCenterForAdd.set(centerId);
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

  /**
   * Submits a new class-gym association with trainers and schedules.
   */
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
        this.loadClasses();
      },
      error: (error) => {
        this.errorMessage.set(error.message || this.translate.instant('classes.errors.save'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Prepares and opens the class metadata editing modal.
   * @param item - The class entity to edit
   */
  openEditModal(item: GymClass): void {
    this.isEditing.set(true);
    this.selectedClass.set(item);
    this.formName = item.name;
    this.formDescription = item.description || '';
    
    const trainerIds = item.trainers?.map(t => t.trainerId) || [];
    this.formTrainerIds.set(trainerIds);
    
    const schedules = item.schedules?.map(s => ({
      id: s.id,
      centerId: s.centerId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime
    })) || [];
    this.formSchedules.set(schedules);
    
    this.newScheduleCenterId = '';
    this.newScheduleDayOfWeek = 0;
    this.newScheduleStartTime = '09:00';
    this.newScheduleEndTime = '10:00';
    
    this.showFormModal.set(true);
    this.errorMessage.set('');
  }

  /**
   * Closes the class metadata form modal.
   */
  closeFormModal(): void {
    this.showFormModal.set(false);
    this.errorMessage.set('');
    this.formTrainerIds.set([]);
    this.formSchedules.set([]);
  }

  /**
   * Opens the confirmation modal for class deletion.
   * @param item - The class to delete
   */
  openDeleteModal(item: GymClass): void {
    this.selectedClass.set(item);
    this.showDeleteModal.set(true);
    this.errorMessage.set('');
  }

  /**
   * Closes the class deletion confirmation modal.
   */
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedClass.set(null);
    this.errorMessage.set('');
  }

  /**
   * Adds a new schedule entry to the current form's temporary collection.
   */
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
    
    this.newScheduleDayOfWeek = 0;
    this.newScheduleStartTime = '09:00';
    this.newScheduleEndTime = '10:00';
    this.errorMessage.set('');
  }

  /**
   * Removes a schedule entry from the current form's temporary collection by index.
   * @param index - The position in the array
   */
  removeSchedule(index: number): void {
    const schedules = this.formSchedules();
    schedules.splice(index, 1);
    this.formSchedules.set([...schedules]);
  }

  /**
   * Toggles a trainer's assignment in the current form context.
   * @param trainerId - Unique ID of the trainer
   */
  toggleTrainer(trainerId: string): void {
    const currentIds = this.formTrainerIds();
    if (currentIds.includes(trainerId)) {
      this.formTrainerIds.set(currentIds.filter(id => id !== trainerId));
    } else {
      this.formTrainerIds.set([...currentIds, trainerId]);
    }
  }

  /**
   * Checks if a trainer is currently selected in the form.
   * @param trainerId - Entity ID
   * @returns True if assigned
   */
  isTrainerSelected(trainerId: string): boolean {
    return this.formTrainerIds().includes(trainerId);
  }

  /**
   * Validates and submits the class metadata form (Create or Update).
   */
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
          this.errorMessage.set(error.message || this.translate.instant('classes.errors.save'));
          this.isLoading.set(false);
        }
      });
    } else {
      this.classesService.createClass(data).subscribe({
        next: (createdClass) => {
          this.selectedClass.set(createdClass);
          this.isEditing.set(true);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(error.message || this.translate.instant('classes.errors.save'));
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Executes the deletion of the selected gym class from the backend.
   */
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
        this.errorMessage.set(error.message || 'Error al eliminar la clase');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Helper to finalize a successful modification action.
   */
  private finishAction(): void {
    this.isLoading.set(false);
    this.closeFormModal();
    this.loadClasses();
  }

  /**
   * Extracts unique centers that offer the currently selected class.
   * @returns Array of center metadata
   */
  getCentersForClass(): Array<{ id: string; name: string }> {
    const classItem = this.selectedClass();
    if (!classItem || !classItem.schedules) return [];
    
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

  /**
   * Retrieves schedules specifically for a center within the selected class.
   * @param centerId - Filter center ID
   * @returns Array of class schedules
   */
  getSchedulesForCenterInClass(centerId: string): ClassCenterSchedule[] {
    const classItem = this.selectedClass();
    if (!classItem || !classItem.schedules) return [];
    return classItem.schedules.filter(s => s.centerId === centerId);
  }

  /**
   * Retrieves trainers assigned to a center for the selected class.
   * @param centerId - Filter center ID
   * @returns Array of trainer assignment metadata
   */
  getTrainersForCenterInClass(centerId: string): any[] {
    const classItem = this.selectedClass();
    if (!classItem || !classItem.trainers) return [];
    
    return classItem.trainers.filter(t => {
      const trainer = this.trainers().find(tr => tr.id === t.trainerId);
      return trainer?.favoriteCenterId === centerId;
    });
  }

  /**
   * Prepares and opens the center-specific assignment modal for editing.
   * @param centerId - The ID of the gym center to manage
   */
  openEditCenterModal(centerId: string): void {
    const center = this.centers().find(c => c.id === centerId);
    if (!center) return;

    this.usersService.listTrainers(centerId).subscribe({
      next: (trainers) => {
        this.centerTrainers.set(trainers);
        
        const currentTrainers = this.getTrainersForCenterInClass(centerId);
        this.formTrainerIds.set(currentTrainers.map(t => t.trainerId));
        
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

  /**
   * Removes a class-gym association after user confirmation.
   * @param centerId - Target center ID
   */
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
        this.loadClasses();
      },
      error: (error) => {
        this.errorMessage.set(error.message || this.translate.instant('classes.errors.delete'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Persists changes to the center-specific assignment (trainers and schedules).
   */
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
        this.loadClasses();
      },
      error: (error) => {
        this.errorMessage.set(error.message || this.translate.instant('classes.errors.save'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Default submit handler for the center-assignment form.
   */
  onAddCenterSubmit(): void {
    this.addCenterToClass();
  }

  /**
   * Checks if a class is already offered at a particular center.
   * @param centerId - Entity ID to check
   * @returns True if at least one schedule entry exists for that center
   */
  isCenterAlreadyInClass(centerId: string): boolean {
    const classItem = this.selectedClass();
    if (!classItem || !classItem.schedules || !centerId) return false;
    return classItem.schedules.some(s => s.centerId === centerId);
  }
}
