import { Component, inject, signal, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importante DatePipe para la fecha
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

const DEFAULT_PROFILE_IMAGE_URL = 'https://res.cloudinary.com/dbzbik0zk/image/upload/v1765270536/fauno.jpg';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LanguageSelectorComponent, ThemeToggleComponent, TranslateModule, DatePipe, ClickOutsideDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  auth = inject(AuthService);
  router = inject(Router);
  notificationService = inject(NotificationService);
  
  // Input opcional para mostrar QR solo en el dashboard
  showQR = input<boolean>(false);

  readonly navLinks = [
    { label: 'Inicio', path: '/', key: 'nav.home', exact: true },
    { label: 'Clases', path: '/clases', key: 'nav.classes', exact: false }, 
    { label: 'Entrenadores', path: '/trainers', key: 'nav.trainers', exact: false },
    { label: 'Centros', path: '/centers', key: 'nav.centers', exact: false },
    { label: 'Membresías', path: '/memberships', key: 'nav.memberships', exact: false }
  ];

  // Estado del menú móvil
  isMobileMenuOpen = signal(false);
  
  // Estado de notificaciones
  showNotifications = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.closeMobileMenu();
  }

  getProfileImageUrl(profileImageUrl: string | null | undefined): string {
    return profileImageUrl ? profileImageUrl : DEFAULT_PROFILE_IMAGE_URL;
  }

  // --- LÓGICA DE NOTIFICACIONES ---
  toggleNotifications() {
    const newState = !this.showNotifications();
    this.showNotifications.set(newState);
    if (newState) {
      // Recargar al abrir para asegurar datos frescos
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

  /**
   * Cierra el dropdown de notificaciones cuando se hace clic fuera.
   * Se llama desde la directiva ClickOutsideDirective.
   */
  closeNotifications() {
    this.showNotifications.set(false);
  }
}