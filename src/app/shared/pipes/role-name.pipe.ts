import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado que formatea nombres de roles para mostrar
 * de manera más legible y amigable al usuario.
 * 
 * Uso: {{ userRole | roleName }}
 */
@Pipe({
  name: 'roleName',
  standalone: true
})
export class RoleNamePipe implements PipeTransform {

  private roleTranslations: { [key: string]: string } = {
    'SUPERADMIN': 'Super Administrador',
    'ADMIN_CENTER': 'Administrador de Centro',
    'TRAINER': 'Entrenador',
    'CLEANER': 'Personal de Limpieza',
    'USER': 'Usuario'
  };

  /**
   * Transforma un código de rol en su nombre legible
   * @param value - Código del rol (ej: 'SUPERADMIN')
   * @returns Nombre formateado del rol (ej: 'Super Administrador')
   */
  transform(value: string): string {
    if (!value) return '';
    
    return this.roleTranslations[value] || value;
  }
}
