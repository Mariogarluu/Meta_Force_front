import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { User } from '../../core/models/user';

type RoleType = 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  auth = inject(AuthService);
  usersService = inject(UsersService);
  router = inject(Router);

  showRoleEditor = signal(false);
  selectedRole = signal<RoleType | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  readonly roles: RoleType[] = ['SUPERADMIN', 'ADMIN_CENTER', 'TRAINER', 'CLEANER', 'USER'];

  currentUser = computed(() => this.auth.currentUser());

  roleName = computed(() => {
    const role = this.currentUser()?.role;
    const roleNames: Record<string, string> = {
      'SUPERADMIN': 'Super Administrador',
      'ADMIN_CENTER': 'Administrador de Centro',
      'TRAINER': 'Entrenador',
      'CLEANER': 'Personal de Limpieza',
      'USER': 'Usuario'
    };
    return roleNames[role || 'USER'] || 'Usuario';
  });

  roleColor = computed(() => {
    const role = this.currentUser()?.role;
    const colors: Record<string, string> = {
      'SUPERADMIN': 'bg-red-500',
      'ADMIN_CENTER': 'bg-purple-500',
      'TRAINER': 'bg-blue-500',
      'CLEANER': 'bg-green-500',
      'USER': 'bg-gray-500'
    };
    return colors[role || 'USER'] || 'bg-gray-500';
  });

  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');

  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');

  constructor() {
    const user = this.currentUser();
    if (user) {
      this.selectedRole.set(user.role);
    }
  }

  /**
   * Abre el modal de edición de rol inicializando el rol seleccionado con el rol actual del usuario.
   * Limpia cualquier mensaje de error previo al abrir el editor.
   */
  openRoleEditor() {
    const user = this.currentUser();
    if (user) {
      this.selectedRole.set(user.role);
      this.showRoleEditor.set(true);
      this.errorMessage.set('');
    }
  }

  /**
   * Cierra el modal de edición de rol y limpia cualquier mensaje de error.
   * Restaura el estado inicial del componente sin guardar cambios.
   */
  closeRoleEditor() {
    this.showRoleEditor.set(false);
    this.errorMessage.set('');
  }

  /**
   * Actualiza el rol del usuario autenticado en el backend.
   * Después de actualizar exitosamente, cierra sesión y redirige al login para obtener un nuevo token JWT.
   * Muestra un mensaje de error si la actualización falla.
   */
  updateRole() {
    const user = this.currentUser();
    const newRole = this.selectedRole();
    
    if (!user || !newRole) {
      return;
    }
    
    if (newRole === user.role) {
      this.closeRoleEditor();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.usersService.updateUser(user.id, { role: newRole }).subscribe({
      next: (updatedUser) => {
        this.isLoading.set(false);
        this.showRoleEditor.set(false);
        
        alert(`Rol actualizado a ${newRole}. Por favor, inicia sesión nuevamente para que los cambios surtan efecto.`);
        
        setTimeout(() => {
          this.auth.logout();
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Error al actualizar el rol');
      }
    });
  }

  /**
   * Cierra la sesión del usuario actual y redirige a la página de login.
   * Limpia el token JWT y la información del usuario del estado de la aplicación.
   */
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Retorna el emoji correspondiente a un rol específico para mostrar en la interfaz.
   * Usa un mapeo de roles a emojis para proporcionar indicadores visuales claros.
   */
  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      'SUPERADMIN': '👑',
      'ADMIN_CENTER': '🏢',
      'TRAINER': '💪',
      'CLEANER': '🧹',
      'USER': '👤'
    };
    return icons[role] || '👤';
  }
}
