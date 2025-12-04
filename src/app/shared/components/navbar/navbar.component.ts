import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

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
}