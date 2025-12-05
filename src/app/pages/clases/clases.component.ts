import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClassesService } from '../../core/services/classes.service';
import { AuthService } from '../../core/services/auth.service';
import { GymClass, CreateClassInput } from '../../core/models/class';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslateModule } from '@ngx-translate/core';

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

  classes = signal<GymClass[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  filterName = signal<string>('');
  filterDescription = signal<string>('');
  showFilters = signal(false);

  showFormModal = signal(false);
  showDeleteModal = signal(false);
  isEditing = signal(false);
  selectedClass = signal<GymClass | null>(null);

  formName = '';
  formDescription = '';

  currentUser = computed(() => this.auth.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');

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
        this.errorMessage.set(error.error?.message || 'Error al cargar las clases');
        this.isLoading.set(false);
      }
    });
  }

  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters(): void {
    this.filterName.set('');
    this.filterDescription.set('');
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedClass.set(null);
    this.formName = '';
    this.formDescription = '';
    this.showFormModal.set(true);
    this.errorMessage.set('');
  }

  openEditModal(item: GymClass): void {
    this.isEditing.set(true);
    this.selectedClass.set(item);
    this.formName = item.name;
    this.formDescription = item.description || '';
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
    if (!this.formName.trim()) {
      this.errorMessage.set('El nombre de la clase es obligatorio');
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
          this.errorMessage.set(error.error?.message || 'Error al guardar la clase');
          this.isLoading.set(false);
        }
      });
    } else {
      this.classesService.createClass(data).subscribe({
        next: () => this.finishAction(),
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Error al guardar la clase');
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
        this.errorMessage.set(error.error?.message || 'Error al eliminar la clase');
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
