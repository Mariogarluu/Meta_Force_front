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

/** Default fallback image URL for user profiles when no custom image is provided */
const DEFAULT_PROFILE_IMAGE_URL = 'https://res.cloudinary.com/dbzbik0zk/image/upload/v1765270536/fauno.jpg';

/**
 * =============================================================================
 * COMPONENTE NAVBAR GLOBAL (BARRA DE NAVEGACIÓN)
 * =============================================================================
 * Este componente proporciona la navegación principal, gestión de sesión,
 * notificaciones en tiempo real y selectores de idioma/tema.
 * 
 * Es un componente Standalone que utiliza Signals para una gestión eficiente
 * de la interfaz móvil y los desplegables.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LanguageSelectorComponent, ThemeToggleComponent, TranslateModule, DatePipe, ClickOutsideDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  /** Injected AuthService for session state and logout */
  auth = inject(AuthService);
  /** Injected Router for programmatic navigation */
  router = inject(Router);
  /** Injected NotificationService for fetching and managing user alerts */
  notificationService = inject(NotificationService);
  
  /** Input signal determining whether to display the QR access button */
  showQR = input<boolean>(false);

  /** 
   * List of main navigation links for the menu.
   * Each entry contains a label, a router path, a translation key, and an exact match flag.
   */
  /** 
   * Enlaces de navegación configurados por defecto.
   * Centraliza los paths y las claves de traducción para el menú.
   */
  readonly navLinks = [
    { label: 'Inicio', path: '/', key: 'nav.home', exact: true },
    { label: 'Clases', path: '/clases', key: 'nav.classes', exact: false }, 
    { label: 'Entrenadores', path: '/trainers', key: 'nav.trainers', exact: false },
    { label: 'Centros', path: '/centers', key: 'nav.centers', exact: false },
    { label: 'Membresías', path: '/memberships', key: 'nav.memberships', exact: false },
    { label: 'Rendimiento', path: '/performance', key: 'nav.performance', exact: false }
  ];

  /** Signal tracking the open/closed state of the mobile hamburger menu */
  isMobileMenuOpen = signal(false);
  
  /** Signal tracking the visibility of the notifications dropdown */
  showNotifications = signal(false);

  /**
   * Toggles the mobile navigation menu.
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  /**
   * Explicitly closes the mobile navigation menu.
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  /**
   * Finaliza la sesión del usuario.
   * Se comunica con el AuthService para limpiar tokens y redirige al login.
   */
  logout(): void {
    // Cerramos sesión lógicamente
    this.auth.logout();
    // Navegamos al punto de entrada
    this.router.navigate(['/login']);
    // Aseguramos que el menú móvil se cierre
    this.closeMobileMenu();
  }

  /**
   * Resolves the profile image URL, falling back to a default if none is provided.
   * @param profileImageUrl - The custom profile image URL string
   * @returns The resolved image URL to display
   */
  getProfileImageUrl(profileImageUrl: string | null | undefined): string {
    return profileImageUrl ? profileImageUrl : DEFAULT_PROFILE_IMAGE_URL;
  }

  /**
   * Toggles the notifications dropdown and refreshes data if opening.
   */
  toggleNotifications() {
    const newState = !this.showNotifications();
    this.showNotifications.set(newState);
    if (newState) {
      this.notificationService.loadNotifications();
    }
  }

  /**
   * Handles a click on a notification item.
   * Marks as read and navigates to the associated link if present.
   * @param notification - The notification entity clicked
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
   * Marks all notifications in the user's history as read.
   */
  markAllRead() {
    this.notificationService.markAllAsRead();
  }

  /**
   * Closes the notifications dropdown when clicking outside its area.
   * Invoked via ClickOutsideDirective.
   */
  closeNotifications() {
    this.showNotifications.set(false);
  }
}