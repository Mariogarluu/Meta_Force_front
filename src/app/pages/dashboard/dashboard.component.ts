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

/** Tipo de unión para los diversos niveles de autorización de usuario en el sistema */
type RoleType = 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';

/** URL de imagen por defecto para los perfiles de usuario cuando no proporcionan una propia */
const DEFAULT_PROFILE_IMAGE_URL = 'https://res.cloudinary.com/dbzbik0zk/image/upload/v1765270536/fauno.jpg';

/**
 * =============================================================================
 * COMPONENTE DASHBOARD (PANEL PRINCIPAL)
 * =============================================================================
 * Componente principal del panel de control de la aplicación (Dashboard).
 * Sirve como página de inicio principal para los usuarios autenticados, interactuando
 * de manera conjunta con casi todos los módulos de entorno privado.
 * 
 * Responsabilidades:
 * 1. Acceso a las notificaciones y lectura en tiempo real.
 * 2. Gestión del perfil, posibilitando actualización de parámetros métricos y carga de avatares.
 * 3. Gestión y asignación de roles (para superadministradores).
 * 4. Puntos de entrada para la navegación a otros módulos del sistema.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ProfileImageManagerComponent, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  /** AuthService inyectado para la identidad del usuario y estado de autenticación */
  auth = inject(AuthService);
  /** UsersService inyectado para la gestión del perfil y roles */
  usersService = inject(UsersService);
  /** NotificationService inyectado para alertas en tiempo real */
  notificationService = inject(NotificationService);
  /** Router inyectado para navegación */
  router = inject(Router);
  /** TranslateService inyectado para internacionalización de la GUI */
  translate = inject(TranslateService);
  /** ElementRef inyectado para acceso directo al DOM en el manejo de eventos */
  private elementRef = inject(ElementRef);

  /** Señal (signal) que controla la visibilidad del modal de editor de roles */
  showRoleEditor = signal(false);
  /** Señal temporal que guarda la selección del rol en el editor */
  selectedRole = signal<RoleType | null>(null);
  /** Señal de seguimiento de carga en background para llamadas a la API */
  isLoading = signal(false);
  /** Señal para mostrar el mensaje de error primario en la interfaz */
  errorMessage = signal<string>('');
  /** Señal que controla la visibilidad del desplegable de notificaciones */
  showNotifications = signal(false);

  /** Señales para el cambio de contraseña */
  showChangePasswordModal = signal(false);
  currentPasswordInput = signal('');
  newPasswordInput = signal('');
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  changePasswordError = signal('');
  changePasswordSuccess = signal('');

  /** 
   * Señal que guarda el estado del formulario de datos físicos.
   * Sincronizado dinámicamente con los metadatos del perfil del usuario en sesión.
   */
  physicalDataForm = signal({
    gender: '',
    birthDate: '',
    height: 0,
    currentWeight: 0,
    medicalNotes: '',
    activityLevel: '',
    goal: ''
  });

  /** Lista fija de roles disponibles en el sistema para el selector del editor */
  readonly roles: RoleType[] = ['SUPERADMIN', 'ADMIN_CENTER', 'TRAINER', 'CLEANER', 'USER'];
  /** Computed signal que siempre devuelve el usuario en sesión actual activo */
  currentUser = computed(() => this.auth.currentUser());
  
  /** Computed signal que devuelve el nombre traducido asignado al rol del usuario activo */
  roleName = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) return this.translate.instant('dashboard.roles.USER');
    return this.translate.instant(`dashboard.roles.${role}`);
  });

  /** Computed signal para entregar la clase CSS de color de fondo correspondiente al rol */
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

  /** Flag calculado en tiempo real para verificar si el usuario es Super Admin */
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  /** Flag calculado en tiempo real para verificar si es Admin de Centro */
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  
  /**
   * Inicializa el dashboard, marcando la opción seleccionada de rol por defecto,
   * y reaccionando a los cambios en el modelo de datos físicos del store en tiempo real.
   */
  constructor() {
    const user = this.currentUser();
    if (user) {
      this.selectedRole.set(user.role);
    }

    // Synchronize physical form when user data changes
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

  /**
   * Alterna la vista del bloque de notificaciones flotante. Dispara la sincronización fresca al abrirse.
   */
  toggleNotifications() {
    const newState = !this.showNotifications();
    this.showNotifications.set(newState);
    if (newState) {
      this.notificationService.loadNotifications();
    }
  }

  /**
   * Manejador central cuando se pulsa una notificación dentro de la lista.
   * Marca como leída y navega al hipervínculo interno provisto en caso de tenerlo.
   * @param notification - La entidad de notificación específica
   */
  handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
    
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
      this.showNotifications.set(false);
    }
  }

  /**
   * Configura todas las notificaciones pendientes de leer como leídas permanentemente.
   */
  markAllRead() {
    this.notificationService.markAllAsRead();
  }

  /**
   * Listener global de clics para atrapar si pulsamos fuera de la cajonera del menú de notificación.
   * @param event - Evento nativo del ratón
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isBell = target.closest('.notification-btn');
    const isDropdown = target.closest('.notification-dropdown');
    
    if (!isBell && !isDropdown) {
      this.showNotifications.set(false);
    }
  }

  /**
   * Carga los datos previos y despliega el editor overlay de administrador de sistema.
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
   * Oculta el popup de editar roles devolviendo la visibilidad al panel de variables globales.
   */
  closeRoleEditor() {
    this.showRoleEditor.set(false);
    this.errorMessage.set('');
  }

  /**
   * Guarda de forma persistente a través del backend el cambio de roles en la base de datos.
   * Tras la inyección exitosa, obligamos a repintar y pasar proceso de reinicio mediante un logout automático reactivo.
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

  /**
   * Envía a actualizar los parámetros médicos y de fitness físicos recogidos en el formulario al servicio proxy correspondiente.
   */
  updatePhysicalData() {
    this.isLoading.set(true);
    this.usersService.updateProfile(this.physicalDataForm()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.auth.refreshUser();
      },
      error: (error) => {
        this.isLoading.set(false);
        alert('Error al actualizar datos físicos: ' + (error.error?.message || error.message));
      }
    });
  }

  /**
   * Abstrae el flujo universal global para destruir la sesión y llevar al control de registro.
   */
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Recupera condicionalmente la ruta CDN de la imagen de cuenta provista, insertando una por defecto si falta.
   * @param profileImageUrl - Enlace url origen de la propiedad
   * @returns Un recurso enlace CDN válido que el tag src puede absorber.
   */
  getProfileImageUrl(profileImageUrl: string | null | undefined): string {
    return profileImageUrl ? profileImageUrl : DEFAULT_PROFILE_IMAGE_URL;
  }

  /**
   * Dispara el input type="file" nativo y oculto para la inyección masiva en la galería. Valida y procesa.
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
   * Helper privado para despachar hacia nuestro UsersService y subir bytes/blob para la imagen avatar final.
   * @param file - File nativo cargado con binarios procedentes del DOM.
   */
  private uploadProfileImage(file: File): void {
    this.usersService.uploadProfileImage(file).subscribe({
      next: () => {
        this.auth.refreshUser();
      },
      error: (error) => {
        alert(error.error?.message || this.translate.instant('profileImage.errors.uploadError'));
      }
    });
  }
  
  /**
   * Retorna una representación iconográfica estandarizada (SVG literal de Tailwind) en base al rol concreto.
   * @param role - ID en duro del esquema en tabla de Supabase / Tipos locales
   * @returns Configuración en crudo HTML SVG DOM Inyectable.
   */
  getRoleIcon(role: string): string {
    const size = 'w-5 h-5';
    switch (role) {
      case 'SUPERADMIN': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.5 12c.7-3.5-3.5-3.5-3.5-3.5S8.5 8.5 9.5 12s3.5 3.5 3.5 3.5S16.5 15.5 15.5 12zM12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /></svg>`;
      case 'ADMIN_CENTER': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M6.75 3v18M17.25 3v18M6.75 3v18M17.25 3v18M6.75 3v18M17.25 3v18M6.75 3v18M17.25 3v18" /></svg>`;
      case 'TRAINER': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-1.036-.84-1.875-1.875-1.875h-4.636V6.184c0-1.036-.84-1.875-1.875-1.875h-2.25c-1.036 0-1.875.84-1.875 1.875v.191H4.875C3.839 6.359 3 7.198 3 8.234V15.75h18V8.25z" /></svg>`;
      case 'CLEANER': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M14.5 19.5l-5-5-5-5M12 10.5v12M12 4.5l-5 5-5 5M12 4.5l5 5 5 5M12 4.5l5 5 5 5M12 4.5l-5 5-5 5" /></svg>`;
      case 'USER': default: 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`;
    }
  }

  openChangePasswordModal() {
    this.currentPasswordInput.set('');
    this.newPasswordInput.set('');
    this.changePasswordError.set('');
    this.changePasswordSuccess.set('');
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showChangePasswordModal.set(true);
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal.set(false);
    this.currentPasswordInput.set('');
    this.newPasswordInput.set('');
    this.changePasswordError.set('');
    this.changePasswordSuccess.set('');
  }

  submitChangePassword() {
    const currentPass = this.currentPasswordInput().trim();
    const newPass = this.newPasswordInput().trim();

    if (!currentPass || !newPass) {
      this.changePasswordError.set('Ambos campos son obligatorios.');
      return;
    }

    if (newPass.length < 6) {
      this.changePasswordError.set('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.changePasswordError.set('');
    this.changePasswordSuccess.set('');

    this.auth.changePassword(currentPass, newPass).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.changePasswordSuccess.set('Contraseña actualizada correctamente. Cerrando sesión...');
        
        // Esperar 2.5 segundos para mostrar el mensaje de éxito antes de forzar el logout y redirección
        setTimeout(() => {
          this.closeChangePasswordModal();
          this.auth.logout();
          this.router.navigate(['/login']);
        }, 2500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.changePasswordError.set(err.message || 'Error al cambiar la contraseña.');
      }
    });
  }
}