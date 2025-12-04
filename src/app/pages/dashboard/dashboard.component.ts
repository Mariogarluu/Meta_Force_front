import { Component, inject, signal, computed, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

type RoleType = 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent, TranslateModule, LanguageSelectorComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  auth = inject(AuthService);
  usersService = inject(UsersService);
  notificationService = inject(NotificationService);
  router = inject(Router);
  translate = inject(TranslateService);
  private elementRef = inject(ElementRef);

  showRoleEditor = signal(false);
  selectedRole = signal<RoleType | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string>('');
  
  // Estado para el dropdown de notificaciones
  showNotifications = signal(false);

  readonly roles: RoleType[] = ['SUPERADMIN', 'ADMIN_CENTER', 'TRAINER', 'CLEANER', 'USER'];

  currentUser = computed(() => this.auth.currentUser());
  
  roleName = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) return this.translate.instant('dashboard.roles.USER');
    return this.translate.instant(`dashboard.roles.${role}`);
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

  // --- LÓGICA DE NOTIFICACIONES ---
  toggleNotifications() {
    const newState = !this.showNotifications();
    this.showNotifications.set(newState);
    if (newState) {
      this.notificationService.loadNotifications();
    }
  }

  handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
    
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
      this.showNotifications.set(false);
    }
  }

  markAllRead() {
    this.notificationService.markAllAsRead();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Cerrar si se hace clic fuera del botón de notificaciones y del dropdown
    const target = event.target as HTMLElement;
    const isBell = target.closest('.notification-btn');
    const isDropdown = target.closest('.notification-dropdown');
    
    if (!isBell && !isDropdown) {
      this.showNotifications.set(false);
    }
  }
  // -------------------------------

  openRoleEditor() {
    const user = this.currentUser();
    if (user) {
      this.selectedRole.set(user.role);
      this.showRoleEditor.set(true);
      this.errorMessage.set('');
    }
  }

  closeRoleEditor() {
    this.showRoleEditor.set(false);
    this.errorMessage.set('');
  }

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

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

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