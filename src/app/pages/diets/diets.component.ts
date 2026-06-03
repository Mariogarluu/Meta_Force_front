import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DietsService } from '../../core/services/diets.service';
import { MealsService } from '../../core/services/meals.service';
import { AuthService } from '../../core/services/auth.service';
import { Diet, DietMeal } from '../../core/models/diet';
import { Meal } from '../../core/models/meal';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Subject, takeUntil } from 'rxjs';

/**
 * Tipo que representa los diferentes tipos de comida del día
 */
type MealType = 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';

/**
 * Componente para gestionar dietas y planes nutricionales semanales.
 * Permite crear, editar y organizar dietas con un sistema de horario tipo calendario,
 * donde las comidas se pueden arrastrar, editar inline y configurar por día.
 * 
 * @component
 * @implements {OnInit, OnDestroy}
 */
@Component({
  selector: 'app-diets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DragDropModule, TranslateModule, NavbarComponent],
  templateUrl: './diets.component.html',
  styleUrl: './diets.component.scss'
})
export class DietsComponent implements OnInit, OnDestroy {
  /** Servicio para gestionar dietas */
  private dietsService = inject(DietsService);
  /** Servicio para gestionar comidas */
  private mealsService = inject(MealsService);
  /** Servicio de autenticación */
  public auth = inject(AuthService);
  /** Servicio de traducción */
  translate = inject(TranslateService);
  /** Subject para gestionar la suscripción y evitar memory leaks */
  private destroy$ = new Subject<void>();

  /** Lista de todas las dietas disponibles */
  diets = signal<Diet[]>([]);
  /** Lista de todas las comidas disponibles */
  meals = signal<Meal[]>([]);
  /** Dieta actualmente seleccionada */
  selectedDiet = signal<Diet | null>(null);
  /** Indica si se está cargando información */
  isLoading = signal(false);
  /** Mensaje de error a mostrar */
  errorMessage = signal<string>('');

  /** Indica si el modal de formulario de dieta está visible */
  showDietFormModal = signal(false);
  /** Indica si el modal de formulario de comida está visible */
  showMealModal = signal(false);
  /** Indica si se está editando una dieta existente */
  isEditingDiet = signal(false);
  /** Indica si se está editando una comida existente */
  isEditingMeal = signal(false);
  /** Comida seleccionada para edición */
  selectedMeal = signal<DietMeal | null>(null);

  /** Formulario para crear/editar dietas */
  dietForm = {
    name: '',
    description: ''
  };
  /** Formulario para agregar/editar comidas a la dieta */
  mealForm = {
    mealId: '',
    dayOfWeek: 0,
    mealType: 'desayuno' as MealType,
    quantity: null as number | null,
    notes: ''
  };

  /** Días de la semana con sus etiquetas (empieza en lunes) */
  daysOfWeek = [
    { value: 0, label: 'Lunes', short: 'Lun' },
    { value: 1, label: 'Martes', short: 'Mar' },
    { value: 2, label: 'Miércoles', short: 'Mié' },
    { value: 3, label: 'Jueves', short: 'Jue' },
    { value: 4, label: 'Viernes', short: 'Vie' },
    { value: 5, label: 'Sábado', short: 'Sáb' },
    { value: 6, label: 'Domingo', short: 'Dom' }
  ];

  /** Tipos de comida disponibles */
  mealTypes: { value: MealType; label: string }[] = [
    { value: 'desayuno', label: 'Desayuno' },
    { value: 'almuerzo', label: 'Almuerzo' },
    { value: 'comida', label: 'Comida' },
    { value: 'merienda', label: 'Merienda' },
    { value: 'cena', label: 'Cena' }
  ];

  /** Usuario actual autenticado */
  currentUser = computed(() => this.auth.currentUser());
  /** Indica si el usuario actual es un entrenador o administrador */
  isTrainer = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'TRAINER' || role === 'ADMIN_CENTER' || role === 'SUPERADMIN';
  });

  /** Configuración de espacios por día (número de slots de comidas por día) */
  mealSlotsPerDay = signal<{ [key: number]: number }>({
    0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5 // Por defecto 5 comidas por día
  });

  /** Estado de edición inline: contiene el ID de la comida y el campo que se está editando */
  editingMeal = signal<{ mealId: string; field: string } | null>(null);
  /** Formulario temporal para edición inline */
  inlineEditForm = signal<{ quantity: number | null; notes: string }>({ quantity: null, notes: '' });

  /**
   * Organiza las comidas de la dieta seleccionada por día de la semana y tipo de comida.
   * @returns Objeto con estructura { [dayOfWeek]: { [mealType]: DietMeal[] } }
   */
  mealsByDayAndType = computed(() => {
    const diet = this.selectedDiet();
    if (!diet) return {};

    const byDay: { [key: number]: { [key: string]: DietMeal[] } } = {};
    this.daysOfWeek.forEach(day => {
      byDay[day.value] = {};
      this.mealTypes.forEach(type => {
        byDay[day.value][type.value] = [];
      });
    });

    const meals = diet.meals || (diet as any).DietMeal || [];
    meals.forEach(meal => {
      if (!byDay[meal.dayOfWeek]) {
        byDay[meal.dayOfWeek] = {};
      }
      if (!byDay[meal.dayOfWeek][meal.mealType]) {
        byDay[meal.dayOfWeek][meal.mealType] = [];
      }
      byDay[meal.dayOfWeek][meal.mealType].push(meal);
    });

    // Ordenar por order
    Object.keys(byDay).forEach(day => {
      Object.keys(byDay[+day]).forEach(type => {
        byDay[+day][type].sort((a, b) => a.order - b.order);
      });
    });

    return byDay;
  });

  /**
   * Calcula cuántos slots vacíos hay disponibles para un día y tipo de comida específicos.
   * @param dayOfWeek - Día de la semana (0-6, donde 0 es domingo)
   * @param mealType - Tipo de comida
   * @returns Array con índices de slots vacíos
   */
  getEmptySlots(dayOfWeek: number, mealType: MealType): number[] {
    const meals = this.mealsByDayAndType()[dayOfWeek]?.[mealType] || [];
    const totalSlots = this.mealSlotsPerDay()[dayOfWeek] || 5;
    const usedSlots = meals.length;
    const emptySlots = Math.max(0, totalSlots - usedSlots);
    return Array(emptySlots).fill(0).map((_, i) => i);
  }

  /**
   * Inicializa el componente cargando las dietas y comidas disponibles.
   */
  ngOnInit() {
    this.loadDiets();
    this.loadMeals();
  }

  /**
   * Limpia las suscripciones al destruir el componente.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de dietas desde el servidor.
   * Si el usuario es entrenador, carga todas las dietas; si no, solo las suyas.
   * Actualiza automáticamente la dieta seleccionada si existe.
   */
  loadDiets() {
    const currentSelectedId = this.selectedDiet()?.id;
    this.isLoading.set(true);
    const userId = this.isTrainer() ? null : this.currentUser()?.id;
    this.dietsService.listDiets(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (diets) => {
          this.diets.set(diets);
          // Actualizar automáticamente la dieta seleccionada si existe
          if (currentSelectedId) {
            const updated = diets.find(d => d.id === currentSelectedId);
            if (updated) {
              this.selectedDiet.set(updated);
            } else {
              // Si la dieta seleccionada ya no existe, seleccionar la primera
              this.selectedDiet.set(diets.length > 0 ? diets[0] : null);
            }
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al cargar dietas');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Carga la lista de comidas disponibles desde el servidor.
   */
  loadMeals() {
    this.mealsService.listMeals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (meals) => {
          this.meals.set(meals);
        },
        error: (err) => {
          console.error('Error al cargar comidas:', err);
        }
      });
  }

  /**
   * Abre el modal para crear una nueva dieta.
   */
  openCreateDietModal() {
    this.dietForm = { name: '', description: '' };
    this.isEditingDiet.set(false);
    this.showDietFormModal.set(true);
  }

  /**
   * Abre el modal para editar una dieta existente.
   * @param diet - Dieta a editar
   */
  openEditDietModal(diet: Diet) {
    this.dietForm = {
      name: diet.name,
      description: diet.description || ''
    };
    this.isEditingDiet.set(true);
    this.selectedDiet.set(diet);
    this.showDietFormModal.set(true);
  }

  /**
   * Guarda una dieta nueva o actualiza una existente.
   * Valida que el nombre no esté vacío antes de guardar.
   */
  saveDiet() {
    if (!this.dietForm.name.trim()) return;

    this.isLoading.set(true);
    const operation = this.isEditingDiet()
      ? this.dietsService.updateDiet(this.selectedDiet()!.id, this.dietForm)
      : this.dietsService.createDiet(this.dietForm);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (diet) => {
        this.loadDiets();
        this.selectedDiet.set(diet);
        this.showDietFormModal.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al guardar dieta');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Elimina una dieta después de confirmar con el usuario.
   * @param diet - Dieta a eliminar
   */
  deleteDiet(diet: Diet) {
    if (!confirm('¿Estás seguro de eliminar esta dieta?')) return;

    this.isLoading.set(true);
    this.dietsService.deleteDiet(diet.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.selectedDiet()?.id === diet.id) {
            this.selectedDiet.set(null);
          }
          this.loadDiets();
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al eliminar dieta');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Selecciona una dieta para visualizar y editar.
   * @param diet - Dieta a seleccionar
   */
  selectDiet(diet: Diet) {
    this.selectedDiet.set(diet);
  }

  /**
   * Abre el modal para agregar una comida a la dieta en un día y tipo específicos.
   * @param dayOfWeek - Día de la semana donde agregar la comida
   * @param mealType - Tipo de comida a agregar
   */
  openAddMealModal(dayOfWeek: number, mealType: MealType) {
    this.mealForm = {
      mealId: '',
      dayOfWeek,
      mealType,
      quantity: null,
      notes: ''
    };
    this.isEditingMeal.set(false);
    this.selectedMeal.set(null);
    this.showMealModal.set(true);
  }

  /**
   * Abre el modal para editar una comida existente en la dieta.
   * @param meal - Comida de la dieta a editar
   */
  openEditMealModal(meal: DietMeal) {
    this.mealForm = {
      mealId: meal.mealId,
      dayOfWeek: meal.dayOfWeek,
      mealType: meal.mealType,
      quantity: meal.quantity ?? null,
      notes: meal.notes || ''
    };
    this.isEditingMeal.set(true);
    this.selectedMeal.set(meal);
    this.showMealModal.set(true);
  }

  /**
   * Guarda una comida nueva o actualiza una existente en la dieta.
   * Calcula automáticamente el orden basado en las comidas existentes.
   */
  saveMeal() {
    if (!this.mealForm.mealId || !this.selectedDiet()) return;

    const diet = this.selectedDiet()!;
    const mealsForDayAndType = this.mealsByDayAndType()[this.mealForm.dayOfWeek]?.[this.mealForm.mealType] || [];
    const maxOrder = mealsForDayAndType.length > 0
      ? Math.max(...mealsForDayAndType.map(m => m.order))
      : -1;

    this.isLoading.set(true);
    const operation = this.isEditingMeal()
      ? this.dietsService.updateDietMeal(
          this.selectedMeal()!.id,
          {
            dayOfWeek: this.mealForm.dayOfWeek,
            mealType: this.mealForm.mealType,
            order: this.selectedMeal()!.order,
            quantity: this.mealForm.quantity ?? null,
            notes: this.mealForm.notes || null
          }
        )
      : this.dietsService.addMealToDiet(diet.id, {
          mealId: this.mealForm.mealId,
          dayOfWeek: this.mealForm.dayOfWeek,
          mealType: this.mealForm.mealType,
          order: maxOrder + 1,
          quantity: this.mealForm.quantity ?? undefined,
          notes: this.mealForm.notes || undefined
        });

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadDiets();
        const updated = this.diets().find(d => d.id === diet.id);
        if (updated) this.selectedDiet.set(updated);
        this.showMealModal.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al guardar comida');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Elimina una comida de la dieta después de confirmar con el usuario.
   * @param meal - Comida a eliminar
   */
  deleteMeal(meal: DietMeal) {
    if (!confirm('¿Estás seguro de eliminar esta comida?')) return;

    this.isLoading.set(true);
    this.dietsService.removeMealFromDiet(meal.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadDiets();
          const diet = this.selectedDiet();
          if (diet) {
            const updated = this.diets().find(d => d.id === diet.id);
            if (updated) this.selectedDiet.set(updated);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al eliminar comida');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Obtiene el nombre de una comida por su ID.
   * @param mealId - ID de la comida
   * @returns Nombre de la comida o 'Comida desconocida' si no se encuentra
   */
  getMealName(mealId: string): string {
    const meal = this.meals().find(m => m.id === mealId);
    return meal?.name || 'Comida desconocida';
  }

  /**
   * Obtiene la etiqueta traducida de un tipo de comida.
   * @param mealType - Tipo de comida
   * @returns Etiqueta del tipo de comida
   */
  getMealTypeLabel(mealType: MealType): string {
    return this.mealTypes.find(t => t.value === mealType)?.label || mealType;
  }

  /**
   * Calcula las calorías totales de una comida basándose en la cantidad.
   * @param mealId - ID de la comida
   * @param quantity - Cantidad de porciones
   * @returns Calorías totales o null si no se puede calcular
   */
  getMealCalories(mealId: string, quantity: number | null | undefined): number | null {
    const meal = this.meals().find(m => m.id === mealId);
    if (!meal || !meal.calories || !quantity) return null;
    return Math.round(meal.calories * quantity);
  }

  /**
   * Calcula las proteínas totales de una comida basándose en la cantidad.
   * @param mealId - ID de la comida
   * @param quantity - Cantidad de porciones
   * @returns Proteínas totales o null
   */
  getMealProtein(mealId: string, quantity: number | null | undefined): number | null {
    const meal = this.meals().find(m => m.id === mealId);
    if (!meal || !meal.protein || !quantity) return null;
    return Math.round(meal.protein * quantity);
  }

  /**
   * Calcula los carbohidratos totales de una comida basándose en la cantidad.
   * @param mealId - ID de la comida
   * @param quantity - Cantidad de porciones
   * @returns Carbohidratos totales o null
   */
  getMealCarbs(mealId: string, quantity: number | null | undefined): number | null {
    const meal = this.meals().find(m => m.id === mealId);
    if (!meal || !meal.carbs || !quantity) return null;
    return Math.round(meal.carbs * quantity);
  }

  /**
   * Calcula las grasas totales de una comida basándose en la cantidad.
   * @param mealId - ID de la comida
   * @param quantity - Cantidad de porciones
   * @returns Grasas totales o null
   */
  getMealFats(mealId: string, quantity: number | null | undefined): number | null {
    const meal = this.meals().find(m => m.id === mealId);
    if (!meal || !meal.fats || !quantity) return null;
    return Math.round(meal.fats * quantity);
  }

  /**
   * Actualiza el número de slots disponibles para un día específico.
   * @param dayOfWeek - Día de la semana (0-6)
   * @param count - Número de slots (mínimo 1)
   */
  updateMealSlots(dayOfWeek: number, count: number) {
    const current = this.mealSlotsPerDay();
    this.mealSlotsPerDay.set({ ...current, [dayOfWeek]: Math.max(1, count) });
  }

  /**
   * Inicia la edición inline de un campo específico de una comida.
   * @param meal - Comida a editar
   * @param field - Campo a editar ('quantity' o 'notes')
   */
  startInlineEdit(meal: DietMeal, field: 'quantity' | 'notes') {
    this.inlineEditForm.set({
      quantity: meal.quantity ?? null,
      notes: meal.notes || ''
    });
    this.editingMeal.set({ mealId: meal.id, field });
  }

  /**
   * Cancela la edición inline actual.
   */
  cancelInlineEdit() {
    this.editingMeal.set(null);
  }

  /**
   * Guarda los cambios de la edición inline de una comida.
   * @param meal - Comida que se está editando
   */
  saveInlineEdit(meal: DietMeal) {
    if (!this.selectedDiet() || !this.editingMeal()) return;

    const form = this.inlineEditForm();
    const updates: any = {
      dayOfWeek: meal.dayOfWeek,
      mealType: meal.mealType,
      order: meal.order
    };

    if (this.editingMeal()!.field === 'quantity') {
      updates.quantity = form.quantity;
      updates.notes = meal.notes || null;
    } else {
      updates.quantity = meal.quantity ?? null;
      updates.notes = form.notes || null;
    }

    this.isLoading.set(true);
    this.dietsService.updateDietMeal(meal.id, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadDiets();
          const diet = this.selectedDiet();
          if (diet) {
            const updated = this.diets().find(d => d.id === diet.id);
            if (updated) this.selectedDiet.set(updated);
          }
          this.editingMeal.set(null);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al actualizar');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Maneja el evento de drag and drop de comidas.
   * Permite mover comidas entre diferentes días y tipos, o reordenarlas dentro del mismo contenedor.
   * @param event - Evento de drag and drop del CDK
   * @param dayOfWeek - Día de la semana destino
   * @param mealType - Tipo de comida destino
   */
  dropMeal(event: CdkDragDrop<DietMeal[]>, dayOfWeek: number, mealType: MealType) {
    if (!this.selectedDiet()) return;

    const diet = this.selectedDiet()!;
    const meals = [...(this.mealsByDayAndType()[dayOfWeek]?.[mealType] || [])];

    if (event.previousContainer === event.container) {
      moveItemInArray(meals, event.previousIndex, event.currentIndex);
    } else {
      // Obtener el meal del contenedor anterior
      const previousMeal = event.previousContainer.data[event.previousIndex];
      if (previousMeal) {
        // Actualizar el meal para moverlo al nuevo día/tipo
        this.isLoading.set(true);
        this.dietsService.updateDietMeal(previousMeal.id, {
          dayOfWeek,
          mealType,
          order: event.currentIndex,
          quantity: previousMeal.quantity ?? null,
          notes: previousMeal.notes || null
        })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadDiets();
              const updated = this.diets().find(d => d.id === diet.id);
              if (updated) this.selectedDiet.set(updated);
              this.isLoading.set(false);
            },
            error: (err) => {
              this.errorMessage.set(err.error?.message || 'Error al mover comida');
              this.loadDiets();
              this.isLoading.set(false);
            }
          });
        return;
      }
    }

    // Reordenar dentro del mismo contenedor
    const updates = meals.map((m, index) => ({
      id: m.id,
      dayOfWeek,
      mealType,
      order: index
    }));

    this.isLoading.set(true);
    this.dietsService.reorderDietMeals(diet.id, { meals: updates })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.selectedDiet.set(updated);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al reordenar comidas');
          this.loadDiets();
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Abre el modal para agregar una comida a un slot vacío específico.
   * @param dayOfWeek - Día de la semana
   * @param mealType - Tipo de comida
   * @param slotIndex - Índice del slot vacío (no se usa actualmente, pero se mantiene para consistencia)
   */
  addMealToSlot(dayOfWeek: number, mealType: MealType, slotIndex: number) {
    this.mealForm = {
      mealId: '',
      dayOfWeek,
      mealType,
      quantity: null,
      notes: ''
    };
    this.isEditingMeal.set(false);
    this.selectedMeal.set(null);
    this.showMealModal.set(true);
  }

  /**
   * Obtiene todas las listas conectadas para drag and drop.
   * Permite que las comidas se puedan arrastrar entre cualquier día y tipo de comida.
   * @param dayOfWeek - Día de la semana (no se usa, pero se mantiene para consistencia con CDK)
   * @param mealType - Tipo de comida (no se usa, pero se mantiene para consistencia con CDK)
   * @returns Array de IDs de listas conectadas
   */
  getConnectedLists(dayOfWeek: number, mealType: MealType): string[] {
    const lists: string[] = [];
    // Conectar con todos los días y tipos de comida
    this.daysOfWeek.forEach(day => {
      this.mealTypes.forEach(type => {
        lists.push(`day-${day.value}-type-${type.value}`);
      });
    });
    return lists;
  }
}

