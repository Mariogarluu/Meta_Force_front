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

/**
 * Componente para gestionar entrenamientos y rutinas de ejercicio semanales.
 * Permite crear, editar y organizar entrenamientos con un sistema de horario tipo calendario,
 * donde los ejercicios se pueden arrastrar, editar inline y configurar por día.
 * 
 * @component
 * @implements {OnInit, OnDestroy}
 */
@Component({
  selector: 'app-workouts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DragDropModule, TranslateModule, NavbarComponent],
  templateUrl: './workouts.component.html',
  styleUrl: './workouts.component.scss'
})
export class WorkoutsComponent implements OnInit, OnDestroy {
  /** Servicio para gestionar entrenamientos */
  private workoutsService = inject(WorkoutsService);
  /** Servicio para gestionar ejercicios */
  private exercisesService = inject(ExercisesService);
  /** Servicio de autenticación */
  public auth = inject(AuthService);
  /** Servicio de traducción */
  translate = inject(TranslateService);
  /** Subject para gestionar la suscripción y evitar memory leaks */
  private destroy$ = new Subject<void>();

  /** Lista de todos los entrenamientos disponibles */
  workouts = signal<Workout[]>([]);
  /** Lista de todos los ejercicios disponibles */
  exercises = signal<Exercise[]>([]);
  /** Entrenamiento actualmente seleccionado */
  selectedWorkout = signal<Workout | null>(null);
  /** Indica si se está cargando información */
  isLoading = signal(false);
  /** Mensaje de error a mostrar */
  errorMessage = signal<string>('');

  /** Indica si el modal de formulario de entrenamiento está visible */
  showWorkoutFormModal = signal(false);
  /** Indica si el modal de formulario de ejercicio está visible */
  showExerciseModal = signal(false);
  /** Indica si el modal de banco de ejercicios está visible */
  showExerciseBankModal = signal(false);
  /** Indica si se está editando un entrenamiento existente */
  isEditingWorkout = signal(false);
  /** Indica si se está editando un ejercicio existente */
  isEditingExercise = signal(false);
  /** Ejercicio seleccionado para edición */
  selectedExercise = signal<WorkoutExercise | null>(null);

  /** Formulario para crear/editar entrenamientos */
  workoutForm = {
    name: '',
    description: ''
  };
  /** Formulario para agregar/editar ejercicios al entrenamiento */
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

  /** Días de la semana con sus etiquetas (empieza en lunes) */
  daysOfWeek = [
    { value: 1, label: 'Lunes', short: 'Lun' },
    { value: 2, label: 'Martes', short: 'Mar' },
    { value: 3, label: 'Miércoles', short: 'Mié' },
    { value: 4, label: 'Jueves', short: 'Jue' },
    { value: 5, label: 'Viernes', short: 'Vie' },
    { value: 6, label: 'Sábado', short: 'Sáb' },
    { value: 0, label: 'Domingo', short: 'Dom' }
  ];

  /** Usuario actual autenticado */
  currentUser = computed(() => this.auth.currentUser());
  /** Indica si el usuario actual es un entrenador o administrador */
  isTrainer = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'TRAINER' || role === 'ADMIN_CENTER' || role === 'SUPERADMIN';
  });

  /** Configuración de espacios por día (número de slots de ejercicios por día) */
  exerciseSlotsPerDay = signal<{ [key: number]: number }>({
    0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5 // Por defecto 5 ejercicios por día
  });

  /** Estado de edición inline: contiene el ID del ejercicio y el campo que se está editando */
  editingExercise = signal<{ exerciseId: string; field: string } | null>(null);
  /** Formulario temporal para edición inline */
  inlineEditForm = signal<{ sets: number | null; reps: number | null; weight: number | null; duration: number | null; restSeconds: number | null; notes: string }>({ 
    sets: null, 
    reps: null, 
    weight: null, 
    duration: null, 
    restSeconds: null, 
    notes: '' 
  });

  /**
   * Organiza los ejercicios del entrenamiento seleccionado por día de la semana.
   * @returns Objeto con estructura { [dayOfWeek]: WorkoutExercise[] }
   */
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

  /**
   * Calcula cuántos slots vacíos hay disponibles para un día específico.
   * @param dayOfWeek - Día de la semana (0-6, donde 0 es domingo)
   * @returns Array con índices de slots vacíos
   */
  getEmptySlots(dayOfWeek: number): number[] {
    const exercises = this.exercisesByDay()[dayOfWeek] || [];
    const totalSlots = this.exerciseSlotsPerDay()[dayOfWeek] || 5;
    const usedSlots = exercises.length;
    const emptySlots = Math.max(0, totalSlots - usedSlots);
    return Array(emptySlots).fill(0).map((_, i) => i);
  }

  /**
   * Inicializa el componente cargando los entrenamientos y ejercicios disponibles.
   */
  ngOnInit() {
    this.loadWorkouts();
    this.loadExercises();
  }

  /**
   * Limpia las suscripciones al destruir el componente.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de entrenamientos desde el servidor.
   * Si el usuario es entrenador, carga todos los entrenamientos; si no, solo los suyos.
   * Actualiza automáticamente el entrenamiento seleccionado si existe.
   */
  loadWorkouts() {
    const currentSelectedId = this.selectedWorkout()?.id;
    this.isLoading.set(true);
    const userId = this.isTrainer() ? null : this.currentUser()?.id;
    this.workoutsService.listWorkouts(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workouts) => {
          this.workouts.set(workouts);
          // Actualizar automáticamente el entrenamiento seleccionado si existe
          if (currentSelectedId) {
            const updated = workouts.find(w => w.id === currentSelectedId);
            if (updated) {
              this.selectedWorkout.set(updated);
            } else {
              // Si el entrenamiento seleccionado ya no existe, seleccionar el primero
              this.selectedWorkout.set(workouts.length > 0 ? workouts[0] : null);
            }
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al cargar entrenamientos');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Carga la lista de ejercicios disponibles desde el servidor.
   */
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

  /**
   * Abre el modal para crear un nuevo entrenamiento.
   */
  openCreateWorkoutModal() {
    this.workoutForm = { name: '', description: '' };
    this.isEditingWorkout.set(false);
    this.showWorkoutFormModal.set(true);
  }

  /**
   * Abre el modal para editar un entrenamiento existente.
   * @param workout - Entrenamiento a editar
   */
  openEditWorkoutModal(workout: Workout) {
    this.workoutForm = {
      name: workout.name,
      description: workout.description || ''
    };
    this.isEditingWorkout.set(true);
    this.selectedWorkout.set(workout);
    this.showWorkoutFormModal.set(true);
  }

  /**
   * Guarda un entrenamiento nuevo o actualiza uno existente.
   * Valida que el nombre no esté vacío antes de guardar.
   */
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

  /**
   * Duplica un entrenamiento existente y selecciona la copia.
   * El backend se encarga de generar el nombre con sufijo (1), (2), etc.
   */
  duplicateWorkout(workout: Workout) {
    this.isLoading.set(true);
    this.workoutsService.duplicateWorkout(workout.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (duplicated) => {
          // Recargamos la lista y seleccionamos la nueva rutina
          this.loadWorkouts();
          this.selectedWorkout.set(duplicated);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al duplicar entrenamiento');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Elimina un entrenamiento después de confirmar con el usuario.
   * @param workout - Entrenamiento a eliminar
   */
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

  /**
   * Selecciona un entrenamiento para visualizar y editar.
   * @param workout - Entrenamiento a seleccionar
   */
  selectWorkout(workout: Workout) {
    this.selectedWorkout.set(workout);
  }

  /**
   * Abre el modal para agregar un ejercicio al entrenamiento en un día específico.
   * @param dayOfWeek - Día de la semana donde agregar el ejercicio
   */
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

  /**
   * Abre el modal para editar un ejercicio existente en el entrenamiento.
   * @param exercise - Ejercicio del entrenamiento a editar
   */
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

  /**
   * Guarda un ejercicio nuevo o actualiza uno existente en el entrenamiento.
   * Calcula automáticamente el orden basado en los ejercicios existentes.
   */
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

  /**
   * Elimina un ejercicio del entrenamiento después de confirmar con el usuario.
   * @param exercise - Ejercicio a eliminar
   */
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

  /**
   * Obtiene el nombre de un ejercicio por su ID.
   * @param exerciseId - ID del ejercicio
   * @returns Nombre del ejercicio o 'Ejercicio desconocido' si no se encuentra
   */
  getExerciseName(exerciseId: string): string {
    const exercise = this.exercises().find(e => e.id === exerciseId);
    return exercise?.name || 'Ejercicio desconocido';
  }

  /**
   * Obtiene el nombre completo de un día de la semana.
   * @param dayOfWeek - Día de la semana (0-6)
   * @returns Nombre del día o cadena vacía si no se encuentra
   */
  getDayName(dayOfWeek: number): string {
    return this.daysOfWeek.find(d => d.value === dayOfWeek)?.label || '';
  }

  /** Objeto Math expuesto para usar en el template (para cálculos como Math.floor) */
  Math = Math;

  /**
   * Actualiza el número de slots disponibles para un día específico.
   * @param dayOfWeek - Día de la semana (0-6)
   * @param count - Número de slots (mínimo 1)
   */
  updateExerciseSlots(dayOfWeek: number, count: number) {
    const current = this.exerciseSlotsPerDay();
    this.exerciseSlotsPerDay.set({ ...current, [dayOfWeek]: Math.max(1, count) });
  }

  /**
   * Inicia la edición inline de un campo específico de un ejercicio.
   * @param exercise - Ejercicio a editar
   * @param field - Campo a editar ('sets', 'reps', 'weight', 'duration', 'restSeconds' o 'notes')
   */
  startInlineEdit(exercise: WorkoutExercise, field: 'sets' | 'reps' | 'weight' | 'duration' | 'restSeconds' | 'notes') {
    this.inlineEditForm.set({
      sets: exercise.sets ?? null,
      reps: exercise.reps ?? null,
      weight: exercise.weight ?? null,
      duration: exercise.duration ?? null,
      restSeconds: exercise.restSeconds ?? null,
      notes: exercise.notes || ''
    });
    this.editingExercise.set({ exerciseId: exercise.id, field });
  }

  /**
   * Cancela la edición inline actual.
   */
  cancelInlineEdit() {
    this.editingExercise.set(null);
  }

  /**
   * Guarda los cambios de la edición inline de un ejercicio.
   * Actualiza solo el campo que se está editando, manteniendo los demás valores.
   * @param exercise - Ejercicio que se está editando
   */
  saveInlineEdit(exercise: WorkoutExercise) {
    if (!this.selectedWorkout() || !this.editingExercise()) return;

    const form = this.inlineEditForm();
    const updates: any = {
      dayOfWeek: exercise.dayOfWeek,
      order: exercise.order
    };

    // Actualizar solo el campo que se está editando
    if (this.editingExercise()!.field === 'sets') {
      updates.sets = form.sets;
      updates.reps = exercise.reps ?? null;
      updates.weight = exercise.weight ?? null;
      updates.duration = exercise.duration ?? null;
      updates.restSeconds = exercise.restSeconds ?? null;
      updates.notes = exercise.notes || null;
    } else if (this.editingExercise()!.field === 'reps') {
      updates.sets = exercise.sets ?? null;
      updates.reps = form.reps;
      updates.weight = exercise.weight ?? null;
      updates.duration = exercise.duration ?? null;
      updates.restSeconds = exercise.restSeconds ?? null;
      updates.notes = exercise.notes || null;
    } else if (this.editingExercise()!.field === 'weight') {
      updates.sets = exercise.sets ?? null;
      updates.reps = exercise.reps ?? null;
      updates.weight = form.weight;
      updates.duration = exercise.duration ?? null;
      updates.restSeconds = exercise.restSeconds ?? null;
      updates.notes = exercise.notes || null;
    } else if (this.editingExercise()!.field === 'duration') {
      updates.sets = exercise.sets ?? null;
      updates.reps = exercise.reps ?? null;
      updates.weight = exercise.weight ?? null;
      updates.duration = form.duration;
      updates.restSeconds = exercise.restSeconds ?? null;
      updates.notes = exercise.notes || null;
    } else if (this.editingExercise()!.field === 'restSeconds') {
      updates.sets = exercise.sets ?? null;
      updates.reps = exercise.reps ?? null;
      updates.weight = exercise.weight ?? null;
      updates.duration = exercise.duration ?? null;
      updates.restSeconds = form.restSeconds;
      updates.notes = exercise.notes || null;
    } else {
      updates.sets = exercise.sets ?? null;
      updates.reps = exercise.reps ?? null;
      updates.weight = exercise.weight ?? null;
      updates.duration = exercise.duration ?? null;
      updates.restSeconds = exercise.restSeconds ?? null;
      updates.notes = form.notes || null;
    }

    this.isLoading.set(true);
    this.workoutsService.updateWorkoutExercise(exercise.id, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWorkouts();
          const workout = this.selectedWorkout();
          if (workout) {
            const updated = this.workouts().find(w => w.id === workout.id);
            if (updated) this.selectedWorkout.set(updated);
          }
          this.editingExercise.set(null);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al actualizar');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Maneja el evento de drag and drop de ejercicios.
   * Permite mover ejercicios entre diferentes días o reordenarlos dentro del mismo contenedor.
   * @param event - Evento de drag and drop del CDK
   * @param dayOfWeek - Día de la semana destino
   */
  dropExercise(event: CdkDragDrop<WorkoutExercise[]>, dayOfWeek: number) {
    if (!this.selectedWorkout()) return;

    const workout = this.selectedWorkout()!;
    const exercises = [...this.exercisesByDay()[dayOfWeek]];

    if (event.previousContainer === event.container) {
      moveItemInArray(exercises, event.previousIndex, event.currentIndex);
    } else {
      // Obtener el exercise del contenedor anterior
      const previousData = event.previousContainer.data;
      if (!previousData || !Array.isArray(previousData) || event.previousIndex >= previousData.length) {
        console.error('Error: datos del contenedor anterior inválidos', { previousData, previousIndex: event.previousIndex });
        return;
      }
      
      const previousExercise = previousData[event.previousIndex];
      if (previousExercise) {
        // Actualizar el exercise para moverlo al nuevo día
        this.isLoading.set(true);
        this.workoutsService.updateWorkoutExercise(previousExercise.id, {
          dayOfWeek,
          order: event.currentIndex,
          sets: previousExercise.sets ?? null,
          reps: previousExercise.reps ?? null,
          weight: previousExercise.weight ?? null,
          duration: previousExercise.duration ?? null,
          restSeconds: previousExercise.restSeconds ?? null,
          notes: previousExercise.notes || null
        })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadWorkouts();
              const updated = this.workouts().find(w => w.id === workout.id);
              if (updated) this.selectedWorkout.set(updated);
              this.isLoading.set(false);
            },
            error: (err) => {
              this.errorMessage.set(err.error?.message || 'Error al mover ejercicio');
              this.loadWorkouts();
              this.isLoading.set(false);
            }
          });
        return;
      }
    }

    // Reordenar dentro del mismo contenedor
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

  /**
   * Abre el modal para agregar un ejercicio a un slot vacío específico.
   * @param dayOfWeek - Día de la semana
   * @param slotIndex - Índice del slot vacío (no se usa actualmente, pero se mantiene para consistencia)
   */
  addExerciseToSlot(dayOfWeek: number, slotIndex: number) {
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

  /**
   * Obtiene todas las listas conectadas para drag and drop.
   * Permite que los ejercicios se puedan arrastrar entre cualquier día.
   * @returns Array de IDs de listas conectadas
   */
  getConnectedLists(): string[] {
    const lists: string[] = [];
    // Conectar con todos los días
    this.daysOfWeek.forEach(day => {
      lists.push(`day-${day.value}`);
    });
    return lists;
  }
}

