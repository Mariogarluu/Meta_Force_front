import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClassesService } from '../../core/services/classes.service';
import { AuthService } from '../../core/services/auth.service';
import { GymClass, CreateClassInput } from '../../core/models/class';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-clases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    ThemeToggleComponent,
    LanguageSelectorComponent,
    TranslateModule
  ],
  templateUrl: './clases.component.html',
  styleUrl: './clases.component.scss'
})
export class ClasesComponent implements OnInit {
  private classesService = inject(ClassesService);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);

  classes = signal<GymClass[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  // Filtros
  filterName = signal<string>('');
  filterDescription = signal<string>('');
  showFilters = signal(false);

  // Modales
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  isEditing = signal(false);

  selectedClass = signal<GymClass | null>(null);

  private initialFormState: CreateClassInput = {
    name: '',
    description: ''
  };

  formState = signal<CreateClassInput>({ ...this.initialFormState });

  currentUser = computed(() => this.auth.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');

  // Lógica de filtrado
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

  hasActiveFilters = computed(() => {
    return !!(this.filterName() || this.filterDescription());
  });

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.classesService.listClasses().subscribe({
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

  // Filtros
  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters(): void {
    this.filterName.set('');
    this.filterDescription.set('');
  }

  // CRUD
  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedClass.set(null);
    this.formState.set({ ...this.initialFormState });
    this.showFormModal.set(true);
    this.errorMessage.set('');
  }

  openEditModal(item: GymClass): void {
    this.isEditing.set(true);
    this.selectedClass.set(item);
    this.formState.set({
      name: item.name,
      description: item.description || ''
    });
    this.showFormModal.set(true);
    this.errorMessage.set('');
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.errorMessage.set('');
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

  onSubmit(): void {
    const data = this.formState();
    if (!data.name.trim()) {
      this.errorMessage.set(this.translate.instant('classes.errors.nameRequired'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    if (this.isEditing() && this.selectedClass()) {
      const id = this.selectedClass()!.id;
      this.classesService.updateClass(id, {
        name: data.name.trim(),
        description: data.description?.trim() || undefined
      }).subscribe({
        next: () => this.finishAction(),
        error: (error) => {
          this.errorMessage.set(error.error?.message || this.translate.instant('classes.errors.save'));
          this.isLoading.set(false);
        }
      });
    } else {
      this.classesService.createClass({
        name: data.name.trim(),
        description: data.description?.trim() || undefined
      }).subscribe({
        next: () => this.finishAction(),
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
        this.errorMessage.set(error.error?.message || this.translate.instant('classes.errors.delete'));
        this.isLoading.set(false);
      }
    });
  }

  private finishAction(): void {
    this.isLoading.set(false);
    this.closeFormModal();
    this.loadClasses();
  }
}


