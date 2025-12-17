import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Pipes personalizados
import { TimeSincePipe } from '../../shared/pipes/time-since.pipe';
import { RoleNamePipe } from '../../shared/pipes/role-name.pipe';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';

// Directivas personalizadas
import { HighlightDirective } from '../../shared/directives/highlight.directive';
import { PermissionDirective } from '../../shared/directives/permission.directive';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

// Componente CVA
import { CenterSelectorComponent } from '../../shared/components/center-selector/center-selector.component';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de demostración que muestra el uso de:
 * - Pipes personalizados (TimeSince, RoleName, StatusBadge)
 * - Directivas personalizadas (Highlight, Permission, ClickOutside)
 * - ControlValueAccessor (CenterSelector)
 */
@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    // Pipes
    TimeSincePipe,
    RoleNamePipe,
    StatusBadgePipe,
    // Directivas
    HighlightDirective,
    PermissionDirective,
    ClickOutsideDirective,
    // Componentes
    CenterSelectorComponent
  ],
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.scss'
})
export class DemoComponent {
  private fb = inject(FormBuilder);
  
  // Formulario de demostración con CVA
  demoForm: FormGroup;
  formSubmitted = false;
  
  // Datos de ejemplo para pipes
  sampleDates = [
    { label: 'Hace 5 minutos', date: new Date(Date.now() - 5 * 60 * 1000) },
    { label: 'Hace 2 horas', date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { label: 'Hace 3 días', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { label: 'Hace 2 semanas', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
  ];
  
  sampleRoles = ['SUPERADMIN', 'ADMIN_CENTER', 'TRAINER', 'CLEANER', 'USER'];
  
  sampleStatuses = [
    { key: 'ACTIVE', label: 'Activo' },
    { key: 'PENDING', label: 'Pendiente' },
    { key: 'INACTIVE', label: 'Inactivo' },
    { key: 'SUSPENDED', label: 'Suspendido' },
  ];
  
  // Estado del dropdown para ClickOutside
  dropdownOpen = false;
  
  constructor() {
    this.demoForm = this.fb.group({
      centerId: ['', Validators.required],
      name: ['', Validators.required]
    });
  }
  
  /**
   * Maneja el envío del formulario de demostración
   */
  onSubmit() {
    if (this.demoForm.valid) {
      this.formSubmitted = true;
      console.log('Form submitted:', this.demoForm.value);
    } else {
      this.demoForm.markAllAsTouched();
    }
  }
  
  /**
   * Resetea el formulario
   */
  resetForm() {
    this.demoForm.reset();
    this.formSubmitted = false;
  }
  
  /**
   * Cierra el dropdown (usado con ClickOutside)
   */
  closeDropdown() {
    this.dropdownOpen = false;
  }
  
  /**
   * Alterna el estado del dropdown
   */
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
}
