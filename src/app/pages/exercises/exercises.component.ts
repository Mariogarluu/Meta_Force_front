import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExercisesService } from '../../core/services/exercises.service';
import { AuthService } from '../../core/services/auth.service';
import { Exercise, CreateExerciseInput, UpdateExerciseInput } from '../../core/models/exercise';
import { TranslateModule } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Subject, takeUntil } from 'rxjs';

/**
 * Component for managing the library of exercises.
 * Supports viewing, creating, editing, and bulk importing exercises.
 */
@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, NavbarComponent],
  templateUrl: './exercises.component.html',
  styleUrl: './exercises.component.scss'
})
export class ExercisesComponent implements OnInit, OnDestroy {
  /** Injected ExercisesService for CRUD and import operations */
  private exercisesService = inject(ExercisesService);
  /** Injected AuthService for user role and permission verification */
  private authService = inject(AuthService);
  /** Subject for handling component unsubscription on context destruction */
  private destroy$ = new Subject<void>();

  /** Signal containing the list of available exercises */
  exercises = signal<Exercise[]>([]);
  /** Signal tracking background API activity */
  isLoading = signal(false);
  /** Signal for displaying error messages in the UI */
  errorMessage = signal<string>('');

  /** Signal for controlling the exercise creation/edit modal visibility */
  showFormModal = signal(false);
  /** Flag determining if the current modal is in edit or create mode */
  isEditing = signal(false);
  /** Signal storing the exercise currently being managed in a modal */
  selectedExercise = signal<Exercise | null>(null);
  /** Signal for controlling the bulk import modal visibility */
  showImportModal = signal(false);
  /** Signal storing the raw JSON string for bulk import */
  importJsonText = signal('');
  /** Signal storing the results/status of the last bulk import attempt */
  importResult = signal<{ created: number; skipped: number; errors: Array<{ exercise: string; error: string }> } | null>(null);

  /** Computed signal checking if the current user has administrative privileges */
  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_CENTER';
  });

  /** 
   * Data model for the exercise creation/update form.
   * Tracks fields such as name, instructions, and associated machine types.
   */
  exerciseForm: CreateExerciseInput = {
    name: '',
    description: '',
    instructions: '',
    imageUrl: '',
    videoUrl: '',
    machineTypeId: ''
  };

  /**
   * Component initialization. Fetches the initial list of exercises.
   */
  ngOnInit() {
    this.loadExercises();
  }

  /**
   * Component cleanup. Triggers unsubscription to prevent memory leaks.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Fetches the complete list of exercises from the backend.
   */
  loadExercises() {
    this.isLoading.set(true);
    this.exercisesService.listExercises()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercises) => {
          this.exercises.set(exercises);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al cargar ejercicios');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Prepares and opens the modal for creating a new exercise.
   */
  openCreateModal() {
    this.exerciseForm = {
      name: '',
      description: '',
      instructions: '',
      imageUrl: '',
      videoUrl: '',
      machineTypeId: ''
    };
    this.isEditing.set(false);
    this.selectedExercise.set(null);
    this.showFormModal.set(true);
  }

  /**
   * Prepares and opens the modal for editing an existing exercise.
   * @param exercise - The exercise entity to edit
   */
  openEditModal(exercise: Exercise) {
    this.exerciseForm = {
      name: exercise.name,
      description: exercise.description || '',
      instructions: exercise.instructions || '',
      imageUrl: exercise.imageUrl || '',
      videoUrl: exercise.videoUrl || '',
      machineTypeId: exercise.machineTypeId || ''
    };
    this.isEditing.set(true);
    this.selectedExercise.set(exercise);
    this.showFormModal.set(true);
  }

  /**
   * Submits the current form data to create or update an exercise.
   */
  saveExercise() {
    if (!this.exerciseForm.name.trim()) return;

    this.isLoading.set(true);
    const operation = this.isEditing()
      ? this.exercisesService.updateExercise(this.selectedExercise()!.id, this.exerciseForm as UpdateExerciseInput)
      : this.exercisesService.createExercise(this.exerciseForm);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadExercises();
        this.showFormModal.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al guardar ejercicio');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Deletes a specific exercise after user confirmation.
   * @param exercise - The exercise to be removed
   */
  deleteExercise(exercise: Exercise) {
    if (!confirm('¿Estás seguro de eliminar este ejercicio?')) return;

    this.isLoading.set(true);
    this.exercisesService.deleteExercise(exercise.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadExercises();
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al eliminar ejercicio');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Opens the bulk import modal and resets its state.
   */
  openImportModal() {
    this.importJsonText.set('');
    this.importResult.set(null);
    this.errorMessage.set('');
    this.showImportModal.set(true);
  }

  /**
   * Closes the bulk import modal.
   */
  closeImportModal() {
    this.showImportModal.set(false);
    this.importJsonText.set('');
    this.importResult.set(null);
  }

  /**
   * Parses the provided JSON and triggers the bulk import service call.
   */
  importExercises() {
    try {
      const jsonData = JSON.parse(this.importJsonText());
      
      if (!Array.isArray(jsonData)) {
        this.errorMessage.set('El JSON debe ser un array de ejercicios');
        return;
      }

      if (jsonData.length === 0) {
        this.errorMessage.set('El array no puede estar vacío');
        return;
      }

      this.isLoading.set(true);
      this.errorMessage.set('');
      
      this.exercisesService.importExercises(jsonData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.importResult.set(result);
            if (result.created > 0) {
              this.loadExercises();
            }
            this.isLoading.set(false);
          },
          error: (err) => {
            this.errorMessage.set(err.error?.message || 'Error al importar ejercicios');
            this.isLoading.set(false);
          }
        });
    } catch (error: any) {
      this.errorMessage.set('JSON inválido: ' + error.message);
    }
  }
}

