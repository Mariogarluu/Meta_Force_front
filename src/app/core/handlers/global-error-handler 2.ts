import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment'; // Asegúrate de tener esto

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private zone: NgZone) {}

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