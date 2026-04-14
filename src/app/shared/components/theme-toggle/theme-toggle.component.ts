import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Component that allows toggling between light and dark modes.
 * Displays a clickable button with an icon that reflects the current theme
 * and provides translated accessible labels for screen readers.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  /** Injected ThemeService for managing the application's appearance state */
  themeService = inject(ThemeService);
  /** Injected TranslateService for UI multi-language support */
  translate = inject(TranslateService);

  /** Signal exposing the current theme name ('light' or 'dark') */
  theme = this.themeService.theme;
  /** Signal exposing a boolean flag for dark mode status */
  isDark = this.themeService.isDark;
  
  /**
   * Computed signal that generates a translated aria-label
   * based on the current theme for accessibility.
   */
  ariaLabel = computed(() => 
    this.isDark() 
      ? this.translate.instant('theme.switchToLight')
      : this.translate.instant('theme.switchToDark')
  );
  
  /**
   * Computed signal that generates the translated title of the current theme.
   */
  title = computed(() => 
    this.isDark() 
      ? this.translate.instant('theme.dark')
      : this.translate.instant('theme.light')
  );

  /**
   * Toggles between light and dark modes by delegating to the ThemeService.
   */
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}

