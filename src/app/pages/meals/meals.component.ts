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

/**
 * Component for managing and displaying food/meal options.
 * Allows administrators to create, edit, delete, and bulk-import meals.
 */
@Component({
  selector: 'app-meals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, NavbarComponent],
  templateUrl: './meals.component.html',
  styleUrl: './meals.component.scss'
})
export class MealsComponent implements OnInit, OnDestroy {
  /** Injected MealsService for data persistence */
  private mealsService = inject(MealsService);
  /** Injected AuthService for permission checks */
  private authService = inject(AuthService);
  /** Observable for resource cleanup on component destruction */
  private destroy$ = new Subject<void>();

  /** Signal containing the full collection of meals */
  meals = signal<Meal[]>([]);
  /** Signal tracking background data operations */
  isLoading = signal(false);
  /** Signal for displaying error feedback to the user */
  errorMessage = signal<string>('');

  /** Signal controlling the visibility of the create/edit meal modal */
  showFormModal = signal(false);
  /** Flag indicating if the current modal operation is an edit or a create */
  isEditing = signal(false);
  /** Signal for the meal currently being manipulated in a modal */
  selectedMeal = signal<Meal | null>(null);
  /** Signal controlling the visibility of the bulk import modal */
  showImportModal = signal(false);
  /** Bound signal for the raw JSON text in the import textarea */
  importJsonText = signal('');
  /** Signal for the summary result of a bulk import operation */
  importResult = signal<{ created: number; skipped: number; errors: Array<{ meal: string; error: string }> } | null>(null);

  /** Computed signal checking if the user has administrative privileges */
  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_CENTER';
  });

  /**
   * Internal form model for creating or updating a meal.
   * Holds the data bound to the meal creation/editing form.
   */
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

  /**
   * Lifecycle hook that initializes the component.
   * Fetches the initial list of meals.
   */
  ngOnInit() {
    this.loadMeals();
  }

  /**
   * Lifecycle hook that cleans up subscriptions and releases resources.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Fetches the comprehensive list of meals from the service and updates the `meals` signal.
   */
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

  /**
   * Resets the form and opens the modal for creating a new meal.
   */
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

  /**
   * Populates the form with existing meal data and opens the edit modal.
   * @param meal - The meal object to edit.
   */
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

  /**
   * Persists the meal data by either creating a new record or updating an existing one
   * based on the `isEditing` status.
   */
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

  /**
   * Removes a meal record after user confirmation.
   * @param meal - The meal object to delete.
   */
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

  /**
   * Opens the interface for bulk meal importing from JSON, resetting previous import data.
   */
  openImportModal() {
    this.importJsonText.set('');
    this.importResult.set(null);
    this.errorMessage.set('');
    this.showImportModal.set(true);
  }

  /**
   * Closes the import modal and resets related data signals.
   */
  closeImportModal() {
    this.showImportModal.set(false);
    this.importJsonText.set('');
    this.importResult.set(null);
  }

  /**
   * Parses the input text as JSON and calls the service for bulk insertion of meals.
   * Displays success or error messages based on the import operation.
   */
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
