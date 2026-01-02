import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { WorkoutsService } from '../../core/services/workouts.service';
import { ExercisesService } from '../../core/services/exercises.service';
import { AuthService } from '../../core/services/auth.service';
import { Workout, WorkoutExercise } from '../../core/models/workout';
import { Exercise } from '../../core/models/exercise';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-workouts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DragDropModule, TranslateModule, NavbarComponent],
  templateUrl: './workouts.component.html',
  styleUrl: './workouts.component.scss'
})
export class WorkoutsComponent implements OnInit, OnDestroy {
  private workoutsService = inject(WorkoutsService);
  private exercisesService = inject(ExercisesService);
  public auth = inject(AuthService);
  translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  workouts = signal<Workout[]>([]);
  exercises = signal<Exercise[]>([]);
  selectedWorkout = signal<Workout | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  // Modales
  showWorkoutFormModal = signal(false);
  showExerciseModal = signal(false);
  showExerciseBankModal = signal(false);
  isEditingWorkout = signal(false);
  isEditingExercise = signal(false);
  selectedExercise = signal<WorkoutExercise | null>(null);

  // Formularios
  workoutForm = {
    name: '',
    description: ''
  };
  exerciseForm = {
    exerciseId: '',
    dayOfWeek: 1,
    sets: null as number | null,
    reps: null as number | null,
    weight: null as number | null,
    duration: null as number | null,
    restSeconds: null as number | null,
    notes: ''
  };

  // Días de la semana
  daysOfWeek = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Lunes', short: 'Lun' },
    { value: 2, label: 'Martes', short: 'Mar' },
    { value: 3, label: 'Miércoles', short: 'Mié' },
    { value: 4, label: 'Jueves', short: 'Jue' },
    { value: 5, label: 'Viernes', short: 'Vie' },
    { value: 6, label: 'Sábado', short: 'Sáb' }
  ];

  currentUser = computed(() => this.auth.currentUser());
  isTrainer = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'TRAINER' || role === 'ADMIN_CENTER' || role === 'SUPERADMIN';
  });

  // Ejercicios organizados por día
  exercisesByDay = computed(() => {
    const workout = this.selectedWorkout();
    if (!workout) return {};

    const byDay: { [key: number]: WorkoutExercise[] } = {};
    this.daysOfWeek.forEach(day => {
      byDay[day.value] = [];
    });

    workout.exercises.forEach(ex => {
      if (!byDay[ex.dayOfWeek]) {
        byDay[ex.dayOfWeek] = [];
      }
      byDay[ex.dayOfWeek].push(ex);
    });

    // Ordenar por order
    Object.keys(byDay).forEach(day => {
      byDay[+day].sort((a, b) => a.order - b.order);
    });

    return byDay;
  });

  ngOnInit() {
    this.loadWorkouts();
    this.loadExercises();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkouts() {
    this.isLoading.set(true);
    const userId = this.isTrainer() ? null : this.currentUser()?.id;
    this.workoutsService.listWorkouts(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workouts) => {
          this.workouts.set(workouts);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al cargar entrenamientos');
          this.isLoading.set(false);
        }
      });
  }

  loadExercises() {
    this.exercisesService.listExercises()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercises) => {
          this.exercises.set(exercises);
        },
        error: (err) => {
          console.error('Error al cargar ejercicios:', err);
        }
      });
  }

  openCreateWorkoutModal() {
    this.workoutForm = { name: '', description: '' };
    this.isEditingWorkout.set(false);
    this.showWorkoutFormModal.set(true);
  }

  openEditWorkoutModal(workout: Workout) {
    this.workoutForm = {
      name: workout.name,
      description: workout.description || ''
    };
    this.isEditingWorkout.set(true);
    this.selectedWorkout.set(workout);
    this.showWorkoutFormModal.set(true);
  }

  saveWorkout() {
    if (!this.workoutForm.name.trim()) return;

    this.isLoading.set(true);
    const operation = this.isEditingWorkout()
      ? this.workoutsService.updateWorkout(this.selectedWorkout()!.id, this.workoutForm)
      : this.workoutsService.createWorkout(this.workoutForm);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (workout) => {
        this.loadWorkouts();
        this.selectedWorkout.set(workout);
        this.showWorkoutFormModal.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al guardar entrenamiento');
        this.isLoading.set(false);
      }
    });
  }

  deleteWorkout(workout: Workout) {
    if (!confirm('¿Estás seguro de eliminar este entrenamiento?')) return;

    this.isLoading.set(true);
    this.workoutsService.deleteWorkout(workout.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.selectedWorkout()?.id === workout.id) {
            this.selectedWorkout.set(null);
          }
          this.loadWorkouts();
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al eliminar entrenamiento');
          this.isLoading.set(false);
        }
      });
  }

  selectWorkout(workout: Workout) {
    this.selectedWorkout.set(workout);
  }

  openAddExerciseModal(dayOfWeek: number) {
    this.exerciseForm = {
      exerciseId: '',
      dayOfWeek,
      sets: null,
      reps: null,
      weight: null,
      duration: null,
      restSeconds: null,
      notes: ''
    };
    this.isEditingExercise.set(false);
    this.selectedExercise.set(null);
    this.showExerciseModal.set(true);
  }

  openEditExerciseModal(exercise: WorkoutExercise) {
    this.exerciseForm = {
      exerciseId: exercise.exerciseId,
      dayOfWeek: exercise.dayOfWeek,
      sets: exercise.sets ?? null,
      reps: exercise.reps ?? null,
      weight: exercise.weight ?? null,
      duration: exercise.duration ?? null,
      restSeconds: exercise.restSeconds ?? null,
      notes: exercise.notes || ''
    };
    this.isEditingExercise.set(true);
    this.selectedExercise.set(exercise);
    this.showExerciseModal.set(true);
  }

  saveExercise() {
    if (!this.exerciseForm.exerciseId || !this.selectedWorkout()) return;

    const workout = this.selectedWorkout()!;
    const exercisesForDay = this.exercisesByDay()[this.exerciseForm.dayOfWeek] || [];
    const maxOrder = exercisesForDay.length > 0
      ? Math.max(...exercisesForDay.map(e => e.order))
      : -1;

    this.isLoading.set(true);
    const operation = this.isEditingExercise()
      ? this.workoutsService.updateWorkoutExercise(
          this.selectedExercise()!.id,
          {
            dayOfWeek: this.exerciseForm.dayOfWeek,
            order: this.selectedExercise()!.order,
            sets: this.exerciseForm.sets ?? null,
            reps: this.exerciseForm.reps ?? null,
            weight: this.exerciseForm.weight ?? null,
            duration: this.exerciseForm.duration ?? null,
            restSeconds: this.exerciseForm.restSeconds ?? null,
            notes: this.exerciseForm.notes || null
          }
        )
      : this.workoutsService.addExerciseToWorkout(workout.id, {
          exerciseId: this.exerciseForm.exerciseId,
          dayOfWeek: this.exerciseForm.dayOfWeek,
          order: maxOrder + 1,
          sets: this.exerciseForm.sets ?? undefined,
          reps: this.exerciseForm.reps ?? undefined,
          weight: this.exerciseForm.weight ?? undefined,
          duration: this.exerciseForm.duration ?? undefined,
          restSeconds: this.exerciseForm.restSeconds ?? undefined,
          notes: this.exerciseForm.notes || undefined
        });

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadWorkouts();
        const updated = this.workouts().find(w => w.id === workout.id);
        if (updated) this.selectedWorkout.set(updated);
        this.showExerciseModal.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al guardar ejercicio');
        this.isLoading.set(false);
      }
    });
  }

  deleteExercise(exercise: WorkoutExercise) {
    if (!confirm('¿Estás seguro de eliminar este ejercicio?')) return;

    this.isLoading.set(true);
    this.workoutsService.removeExerciseFromWorkout(exercise.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWorkouts();
          const workout = this.selectedWorkout();
          if (workout) {
            const updated = this.workouts().find(w => w.id === workout.id);
            if (updated) this.selectedWorkout.set(updated);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al eliminar ejercicio');
          this.isLoading.set(false);
        }
      });
  }

  dropExercise(event: CdkDragDrop<WorkoutExercise[]>, dayOfWeek: number) {
    if (!this.selectedWorkout()) return;

    const workout = this.selectedWorkout()!;
    const exercises = [...this.exercisesByDay()[dayOfWeek]];

    if (event.previousContainer === event.container) {
      moveItemInArray(exercises, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    // Actualizar órdenes
    const updates = exercises.map((ex, index) => ({
      id: ex.id,
      dayOfWeek,
      order: index
    }));

    this.isLoading.set(true);
    this.workoutsService.reorderWorkoutExercises(workout.id, { exercises: updates })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.selectedWorkout.set(updated);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al reordenar ejercicios');
          this.loadWorkouts();
          this.isLoading.set(false);
        }
      });
  }

  getExerciseName(exerciseId: string): string {
    const exercise = this.exercises().find(e => e.id === exerciseId);
    return exercise?.name || 'Ejercicio desconocido';
  }

  getDayName(dayOfWeek: number): string {
    return this.daysOfWeek.find(d => d.value === dayOfWeek)?.label || '';
  }

  // Exponer Math para usar en el template
  Math = Math;
}

