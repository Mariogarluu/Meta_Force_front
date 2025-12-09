import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

const DEFAULT_PROFILE_IMAGE_URL = 'https://res.cloudinary.com/dbzbik0zk/image/upload/v1765270536/fauno.jpg';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LanguageSelectorComponent, ThemeToggleComponent, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  auth = inject(AuthService);
  
  readonly navLinks = [
    { label: 'Inicio', path: '/', key: 'nav.home' },
    { label: 'Clases', path: '/dashboard', key: 'nav.classes' }, 
    { label: 'Entrenadores', path: '/users', key: 'nav.trainers' },
    { label: 'Membresía', path: '/register', key: 'nav.membership' }
  ];

  /**
   * Obtiene la URL de la imagen de perfil, usando el fallback si es necesario.
   * Si no tiene imagen o es null, retorna la URL por defecto de Cloudinary.
   */
  getProfileImageUrl(profileImageUrl: string | null | undefined): string {
    return profileImageUrl ? profileImageUrl : DEFAULT_PROFILE_IMAGE_URL;
  }
}