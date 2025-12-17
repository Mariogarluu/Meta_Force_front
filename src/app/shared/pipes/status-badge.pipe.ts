import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado que retorna clases CSS para badges de estado.
 * Útil para aplicar estilos consistentes según el estado de un elemento.
 * 
 * Uso: <span [ngClass]="status | statusBadge">{{ status }}</span>
 */
@Pipe({
  name: 'statusBadge',
  standalone: true
})
export class StatusBadgePipe implements PipeTransform {

  private statusClasses: { [key: string]: string } = {
    // Estados de usuarios
    'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'INACTIVE': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'SUSPENDED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    
    // Estados de máquinas
    'operativa': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'en mantenimiento': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'fuera de servicio': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    
    // Estados genéricos
    'success': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'warning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'info': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  };

  /**
   * Transforma un estado en las clases CSS correspondientes para el badge
   * @param value - Estado a transformar
   * @returns String con las clases CSS de Tailwind para el badge
   */
  transform(value: string): string {
    if (!value) return '';
    
    return this.statusClasses[value] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}
