import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado que convierte una fecha en texto de tiempo transcurrido.
 * Ejemplos: "hace 3 horas", "hace 2 días", "hace 1 mes"
 * 
 * Uso: {{ date | timeSince }}
 */
@Pipe({
  name: 'timeSince',
  standalone: true
})
export class TimeSincePipe implements PipeTransform {

  /**
   * Transforma una fecha en un string que representa el tiempo transcurrido
   * @param value - Fecha a transformar (Date, string o número)
   * @returns String con el tiempo transcurrido en formato legible
   */
  transform(value: Date | string | number): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 0) return 'justo ahora';

    const intervals: { [key: string]: number } = {
      'año': 31536000,
      'mes': 2592000,
      'semana': 604800,
      'día': 86400,
      'hora': 3600,
      'minuto': 60,
      'segundo': 1
    };

    for (const [key, value] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / value);
      
      if (interval >= 1) {
        if (interval === 1) {
          return `hace 1 ${key}`;
        } else {
          // Pluralizar correctamente
          const plural = key === 'mes' ? 'meses' : `${key}s`;
          return `hace ${interval} ${plural}`;
        }
      }
    }

    return 'justo ahora';
  }
}
