import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment'; // Asegúrate de tener esto

/**
 * Global error handler that captures unhandled exceptions across the application.
 * Differentiates behavior between development (verbose logging) and 
 * production (suppressed technical details/user-friendly alerts).
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  /** 
   * Injected NgZone to ensure UI-thread safety for optional notifications and alerts.
   * @type {NgZone}
   */
  private zone: NgZone;

  /**
   * Constructs the global error handler.
   * @param zone - The Angular NgZone to perform tasks inside/outside Angular's zone
   */
  constructor(zone: NgZone) {
    this.zone = zone;
  }

  /**
   * Intercepts and processes application-wide errors.
   * @param error - The error or exception object to handle
   */
  handleError(error: any): void {
    // 1. En Desarrollo: Mostramos todo para debuggear
    if (!environment.production) {
      console.error('🔥 Global Error:', error);
      return;
    }

    // 2. En Producción: SUPRIMIR DETALLES TÉCNICOS
    // Solo mostramos un mensaje genérico al usuario o lo enviamos a un servicio de log (Sentry, etc.)
    // Nunca imprimir stack traces en la consola del navegador en prod.
    
    // Opcional: Notificar al usuario via Toast (dentro de NgZone)
    /*
    this.zone.run(() => {
       // toastService.show('Ha ocurrido un error inesperado');
    });
    */
    
    console.log('An unexpected error occurred. Please contact support.');
  }
}