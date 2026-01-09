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

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, NavbarComponent],
  templateUrl: './exercises.component.html',
  styleUrl: './exercises.component.scss'
})
export class ExercisesComponent implements OnInit, OnDestroy {
  private exercisesService = inject(ExercisesService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  exercises = signal<Exercise[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  // Modal
  showFormModal = signal(false);
  isEditing = signal(false);
  selectedExercise = signal<Exercise | null>(null);
  showImportModal = signal(false);
  importJsonText = signal('');
  importResult = signal<{ created: number; skipped: number; errors: Array<{ exercise: string; error: string }> } | null>(null);

  // Admin check
  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_CENTER';
  });

  // Formulario
  exerciseForm: CreateExerciseInput = {
    name: '',
    description: '',
    instructions: '',
    imageUrl: '',
    videoUrl: '',
    machineTypeId: ''
  };

  ngOnInit() {
    this.loadExercises();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  openImportModal() {
    this.importJsonText.set('');
    this.importResult.set(null);
    this.errorMessage.set('');
    this.showImportModal.set(true);
  }

  closeImportModal() {
    this.showImportModal.set(false);
    this.importJsonText.set('');
    this.importResult.set(null);
  }

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

