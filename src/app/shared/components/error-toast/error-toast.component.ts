import { Component, inject } from '@angular/core';
import { ErrorService } from '../../../core/services/error.service';
import { CommonModule } from '@angular/common';
import { ErrorType } from '../../../core/models/app-error';

/**
 * Global error notification component.
 * Displays temporary toast messages for various application-level errors
 * injected through the ErrorService.
 */
@Component({
  selector: 'app-error-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-toast.component.html',
  styleUrl: './error-toast.component.scss'
})
export class ErrorToastComponent {
  /** Injected ErrorService containing the active global error state and signals */
  errorService = inject(ErrorService);
  
  /**
   * Translates an internal error type identifier into a localized, user-friendly display title.
   * @param type - The system's classification of the error (e.g., 'auth', 'network')
   * @returns A string representing the error category in Spanish
   */
  getErrorTitle(type: ErrorType): string {
    const titles: Record<string, string> = {
      auth: 'Error de Autenticación',
      network: 'Error de Conexión',
      validation: 'Error de Validación',
      server: 'Error del Servidor',
      unknown: 'Error'
    };
    return titles[type] || 'Error';
  }
  
  /**
   * Determines the structural CSS background classes based on the error urgency/type.
   * Returns a Tailwind-based gradient string.
   * @param type - The severity or category of the error
   * @returns A class string for the component's background styling
   */
  getBackgroundClass(type: ErrorType): string {
    const classes: Record<string, string> = {
      auth: 'bg-gradient-to-br from-red-600 via-red-500 to-pink-600',
      network: 'bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-600',
      validation: 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-orange-500',
      server: 'bg-gradient-to-br from-red-700 via-red-600 to-red-500',
      unknown: 'bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500'
    };
    return classes[type] || 'bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500';
  }
}

