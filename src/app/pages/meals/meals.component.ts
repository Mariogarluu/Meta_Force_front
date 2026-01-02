import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MealsService } from '../../core/services/meals.service';
import { AuthService } from '../../core/services/auth.service';
import { Meal, CreateMealInput, UpdateMealInput } from '../../core/models/meal';
import { TranslateModule } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-meals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, NavbarComponent],
  templateUrl: './meals.component.html',
  styleUrl: './meals.component.scss'
})
export class MealsComponent implements OnInit, OnDestroy {
  private mealsService = inject(MealsService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  meals = signal<Meal[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  // Modal
  showFormModal = signal(false);
  isEditing = signal(false);
  selectedMeal = signal<Meal | null>(null);
  showImportModal = signal(false);
  importJsonText = signal('');
  importResult = signal<{ created: number; skipped: number; errors: Array<{ meal: string; error: string }> } | null>(null);

  // Admin check
  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_CENTER';
  });

  // Formulario
  mealForm: CreateMealInput = {
    name: '',
    description: '',
    instructions: '',
    imageUrl: '',
    calories: undefined,
    protein: undefined,
    carbs: undefined,
    fats: undefined,
    fiber: undefined
  };

  ngOnInit() {
    this.loadMeals();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMeals() {
    this.isLoading.set(true);
    this.mealsService.listMeals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (meals) => {
          this.meals.set(meals);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al cargar comidas');
          this.isLoading.set(false);
        }
      });
  }

  openCreateModal() {
    this.mealForm = {
      name: '',
      description: '',
      instructions: '',
      imageUrl: '',
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fats: undefined,
      fiber: undefined
    };
    this.isEditing.set(false);
    this.selectedMeal.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(meal: Meal) {
    this.mealForm = {
      name: meal.name,
      description: meal.description || '',
      instructions: meal.instructions || '',
      imageUrl: meal.imageUrl || '',
      calories: meal.calories ?? undefined,
      protein: meal.protein ?? undefined,
      carbs: meal.carbs ?? undefined,
      fats: meal.fats ?? undefined,
      fiber: meal.fiber ?? undefined
    };
    this.isEditing.set(true);
    this.selectedMeal.set(meal);
    this.showFormModal.set(true);
  }

  saveMeal() {
    if (!this.mealForm.name.trim()) return;

    this.isLoading.set(true);
    const operation = this.isEditing()
      ? this.mealsService.updateMeal(this.selectedMeal()!.id, this.mealForm as UpdateMealInput)
      : this.mealsService.createMeal(this.mealForm);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadMeals();
        this.showFormModal.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al guardar comida');
        this.isLoading.set(false);
      }
    });
  }

  deleteMeal(meal: Meal) {
    if (!confirm('¿Estás seguro de eliminar esta comida?')) return;

    this.isLoading.set(true);
    this.mealsService.deleteMeal(meal.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadMeals();
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al eliminar comida');
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

  importMeals() {
    try {
      const jsonData = JSON.parse(this.importJsonText());
      
      if (!Array.isArray(jsonData)) {
        this.errorMessage.set('El JSON debe ser un array de comidas');
        return;
      }

      if (jsonData.length === 0) {
        this.errorMessage.set('El array no puede estar vacío');
        return;
      }

      this.isLoading.set(true);
      this.errorMessage.set('');
      
      this.mealsService.importMeals(jsonData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.importResult.set(result);
            if (result.created > 0) {
              this.loadMeals();
            }
            this.isLoading.set(false);
          },
          error: (err) => {
            this.errorMessage.set(err.error?.message || 'Error al importar comidas');
            this.isLoading.set(false);
          }
        });
    } catch (error: any) {
      this.errorMessage.set('JSON inválido: ' + error.message);
    }
  }
}

