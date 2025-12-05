import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Componente que permite alternar entre modo claro y oscuro.
 * Muestra un botón con icono que cambia según el tema actual
 * y proporciona etiquetas accesibles traducidas.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
  translate = inject(TranslateService);

  theme = this.themeService.theme;
  isDark = this.themeService.isDark;
  
  /**
   * Computed signal que genera la etiqueta aria-label traducida
   * según el tema actual para accesibilidad.
   */
  ariaLabel = computed(() => 
    this.isDark() 
      ? this.translate.instant('theme.switchToLight')
      : this.translate.instant('theme.switchToDark')
  );
  
  /**
   * Computed signal que genera el título traducido del tema actual.
   */
  title = computed(() => 
    this.isDark() 
      ? this.translate.instant('theme.dark')
      : this.translate.instant('theme.light')
  );

  /**
   * Alterna entre modo claro y oscuro llamando al servicio de tema.
   */
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}

