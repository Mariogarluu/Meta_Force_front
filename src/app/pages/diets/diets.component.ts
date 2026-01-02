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

type MealType = 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena';

@Component({
  selector: 'app-diets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DragDropModule, TranslateModule, NavbarComponent],
  templateUrl: './diets.component.html',
  styleUrl: './diets.component.scss'
})
export class DietsComponent implements OnInit, OnDestroy {
  private dietsService = inject(DietsService);
  private mealsService = inject(MealsService);
  public auth = inject(AuthService);
  translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  diets = signal<Diet[]>([]);
  meals = signal<Meal[]>([]);
  selectedDiet = signal<Diet | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  // Modales
  showDietFormModal = signal(false);
  showMealModal = signal(false);
  isEditingDiet = signal(false);
  isEditingMeal = signal(false);
  selectedMeal = signal<DietMeal | null>(null);

  // Formularios
  dietForm = {
    name: '',
    description: ''
  };
  mealForm = {
    mealId: '',
    dayOfWeek: 1,
    mealType: 'desayuno' as MealType,
    quantity: null as number | null,
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

  mealTypes: { value: MealType; label: string }[] = [
    { value: 'desayuno', label: 'Desayuno' },
    { value: 'almuerzo', label: 'Almuerzo' },
    { value: 'comida', label: 'Comida' },
    { value: 'merienda', label: 'Merienda' },
    { value: 'cena', label: 'Cena' }
  ];

  currentUser = computed(() => this.auth.currentUser());
  isTrainer = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'TRAINER' || role === 'ADMIN_CENTER' || role === 'SUPERADMIN';
  });

  // Comidas organizadas por día y tipo
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

    diet.meals.forEach(meal => {
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

  ngOnInit() {
    this.loadDiets();
    this.loadMeals();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDiets() {
    this.isLoading.set(true);
    const userId = this.isTrainer() ? null : this.currentUser()?.id;
    this.dietsService.listDiets(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (diets) => {
          this.diets.set(diets);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al cargar dietas');
          this.isLoading.set(false);
        }
      });
  }

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

  openCreateDietModal() {
    this.dietForm = { name: '', description: '' };
    this.isEditingDiet.set(false);
    this.showDietFormModal.set(true);
  }

  openEditDietModal(diet: Diet) {
    this.dietForm = {
      name: diet.name,
      description: diet.description || ''
    };
    this.isEditingDiet.set(true);
    this.selectedDiet.set(diet);
    this.showDietFormModal.set(true);
  }

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

  selectDiet(diet: Diet) {
    this.selectedDiet.set(diet);
  }

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

  dropMeal(event: CdkDragDrop<DietMeal[]>, dayOfWeek: number, mealType: MealType) {
    if (!this.selectedDiet()) return;

    const diet = this.selectedDiet()!;
    const meals = [...(this.mealsByDayAndType()[dayOfWeek]?.[mealType] || [])];

    if (event.previousContainer === event.container) {
      moveItemInArray(meals, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

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

  getMealName(mealId: string): string {
    const meal = this.meals().find(m => m.id === mealId);
    return meal?.name || 'Comida desconocida';
  }

  getMealTypeLabel(mealType: MealType): string {
    return this.mealTypes.find(t => t.value === mealType)?.label || mealType;
  }

  getMealCalories(mealId: string, quantity: number | null | undefined): number | null {
    const meal = this.meals().find(m => m.id === mealId);
    if (!meal || !meal.calories || !quantity) return null;
    return Math.round(meal.calories * quantity);
  }
}

