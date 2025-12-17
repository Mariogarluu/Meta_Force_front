import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

/**
 * Directiva estructural personalizada que muestra u oculta elementos según los permisos del usuario.
 * Similar a *ngIf pero basado en roles del usuario autenticado.
 * 
 * Uso: <div *appPermission="['SUPERADMIN', 'ADMIN_CENTER']">Contenido solo para admins</div>
 */
@Directive({
  selector: '[appPermission]',
  standalone: true
})
export class PermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  
  private allowedRoles: string[] = [];
  private hasView = false;

  /**
   * Define los roles permitidos para mostrar el elemento
   * @param roles - Array de roles que tienen permiso para ver el contenido
   */
  @Input() set appPermission(roles: string | string[]) {
    this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor() {
    // Usar effect para reaccionar a cambios en el usuario actual
    effect(() => {
      const currentUser = this.authService.currentUser();
      this.updateView();
    });
  }

  /**
   * Actualiza la vista según los permisos del usuario actual
   */
  private updateView() {
    const currentUser = this.authService.currentUser();
    const hasPermission = currentUser && this.allowedRoles.includes(currentUser.role);

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
