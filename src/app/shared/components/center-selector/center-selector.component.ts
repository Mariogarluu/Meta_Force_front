import { Component, forwardRef, inject, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CentersService } from '../../../core/services/centers.service';
import { Center } from '../../../core/models/center';

/**
 * Componente personalizado que implementa ControlValueAccessor.
 * Selector de centro integrado con formularios reactivos de Angular.
 * Permite seleccionar un centro de una lista obtenida del backend.
 * 
 * Uso en formulario reactivo:
 * <app-center-selector formControlName="centerId"></app-center-selector>
 */
@Component({
  selector: 'app-center-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CenterSelectorComponent),
      multi: true
    }
  ],
  template: `
    <div class="center-selector">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Seleccionar Centro
      </label>
      
      @if (loading()) {
        <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm">Cargando centros...</span>
        </div>
      } @else {
        <select
          [value]="value"
          (change)="onSelectChange($event)"
          [disabled]="isDisabled"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-200">
          <option value="">-- Selecciona un centro --</option>
          @for (center of centers(); track center.id) {
            <option [value]="center.id">{{ center.name }}</option>
          }
        </select>
        
        @if (centers().length === 0) {
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No hay centros disponibles
          </p>
        }
      }
      
      @if (error()) {
        <p class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ error() }}
        </p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CenterSelectorComponent implements ControlValueAccessor, OnInit {
  private centersService = inject(CentersService);
  
  centers = signal<Center[]>([]);
  loading = signal(true);
  error = signal<string>('');
  
  value: string = '';
  isDisabled = false;
  
  // Funciones de callback para ControlValueAccessor
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  ngOnInit() {
    this.loadCenters();
  }

  /**
   * Carga la lista de centros disponibles desde el servicio
   */
  private loadCenters() {
    this.loading.set(true);
    this.error.set('');
    
    this.centersService.listCentersWithIds().subscribe({
      next: (centers: Center[]) => {
        this.centers.set(centers);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set('Error al cargar los centros');
        this.loading.set(false);
        console.error('Error loading centers:', err);
      }
    });
  }

  /**
   * Maneja el cambio de selección en el dropdown
   * @param event - Evento del select
   */
  onSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
    this.onTouched();
  }

  // Implementación de ControlValueAccessor

  /**
   * Escribe un valor en el componente (llamado por Angular forms)
   * @param value - Valor a escribir (ID del centro)
   */
  writeValue(value: string): void {
    this.value = value || '';
  }

  /**
   * Registra la función callback para cambios de valor
   * @param fn - Función a llamar cuando el valor cambia
   */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * Registra la función callback para el evento touched
   * @param fn - Función a llamar cuando el control es tocado
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Establece el estado deshabilitado del control
   * @param isDisabled - Si el control debe estar deshabilitado
   */
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
