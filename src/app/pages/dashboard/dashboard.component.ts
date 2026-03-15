import { Component, inject, signal, computed, ElementRef, HostListener, effect } from '@angular/core';
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
import { ProfileImageManagerComponent } from '../../shared/components/profile-image-manager/profile-image-manager.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

type RoleType = 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';

const DEFAULT_PROFILE_IMAGE_URL = 'https://res.cloudinary.com/dbzbik0zk/image/upload/v1765270536/fauno.jpg';

/**
 * Main application dashboard component.
 * Serves as the primary landing page for authenticated users, providing
 * access to notifications, profile management (including role editing and
 * image uploads), and navigation to other system modules.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ProfileImageManagerComponent, NavbarComponent],
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

  // Perfil Físico
  physicalDataForm = signal({
    gender: '',
    birthDate: '',
    height: 0,
    currentWeight: 0,
    medicalNotes: '',
    activityLevel: '',
    goal: ''
  });

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

    // Sincronizar formulario físico cuando cambia el usuario
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.physicalDataForm.set({
          gender: user.gender || '',
          birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
          height: user.height || 0,
          currentWeight: user.currentWeight || 0,
          medicalNotes: user.medicalNotes || '',
          activityLevel: user.activityLevel || '',
          goal: user.goal || ''
        });
      }
    });
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
        
        const roleName = this.translate.instant(`dashboard.roles.${newRole}`);
        alert(this.translate.instant('dashboard.roleEditor.successMessage', { role: roleName }));
        
        setTimeout(() => {
          this.auth.logout();
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || this.translate.instant('dashboard.roleEditor.error'));
      }
    });
  }

  updatePhysicalData() {
    this.isLoading.set(true);
    this.usersService.updateProfile(this.physicalDataForm()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.auth.refreshUser();
        // Opcional: mostrar notificación de éxito (ya tenemos NotificationService)
      },
      error: (error) => {
        this.isLoading.set(false);
        alert('Error al actualizar datos físicos: ' + (error.error?.message || error.message));
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene la URL de la imagen de perfil del usuario.
   * Si no tiene imagen o es null, retorna la imagen por defecto de Cloudinary.
   */
  getProfileImageUrl(profileImageUrl: string | null | undefined): string {
    return profileImageUrl ? profileImageUrl : DEFAULT_PROFILE_IMAGE_URL;
  }

  /**
   * Abre el selector de archivos para cambiar la imagen de perfil.
   * Se activa al hacer clic en el avatar.
   */
  triggerProfileImageUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files?.[0];
      if (file) {
      if (!file.type.startsWith('image/')) {
        alert(this.translate.instant('profileImage.errors.invalidFile'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(this.translate.instant('profileImage.errors.fileTooLarge'));
        return;
      }
        this.uploadProfileImage(file);
      }
    };
    input.click();
  }

  /**
   * Sube la imagen de perfil a Cloudinary.
   */
  private uploadProfileImage(file: File): void {
    this.usersService.uploadProfileImage(file).subscribe({
      next: () => {
        // Refrescar el usuario actual para que la imagen se actualice
        this.auth.refreshUser();
      },
      error: (error) => {
        alert(error.error?.message || this.translate.instant('profileImage.errors.uploadError'));
      }
    });
  }
  
  /**
   * Retorna un SVG (string) para el icono de rol.
   * Se utiliza [innerHTML] en el template.
   */
  getRoleIcon(role: string): string {
    const size = 'w-5 h-5';
    // Se utiliza stroke="white" para asegurar la visibilidad en el span con color de fondo
    switch (role) {
      case 'SUPERADMIN': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.5 12c.7-3.5-3.5-3.5-3.5-3.5S8.5 8.5 9.5 12s3.5 3.5 3.5 3.5S16.5 15.5 15.5 12zM12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /></svg>`;
      case 'ADMIN_CENTER': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M6.75 3v18M17.25 3v18M6.75 3v18M17.25 3v18M6.75 3v18M17.25 3v18" /></svg>`;
      case 'TRAINER': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-1.036-.84-1.875-1.875-1.875h-4.636V6.184c0-1.036-.84-1.875-1.875-1.875h-2.25c-1.036 0-1.875.84-1.875 1.875v.191H4.875C3.839 6.359 3 7.198 3 8.234V15.75h18V8.25z" /></svg>`;
      case 'CLEANER': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M14.5 19.5l-5-5-5-5M12 10.5v12M12 4.5l-5 5-5 5M12 4.5l5 5 5 5M12 4.5l5 5 5 5M12 4.5l-5 5-5 5" /></svg>`;
      case 'USER': default: 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`;
    }
  }
}