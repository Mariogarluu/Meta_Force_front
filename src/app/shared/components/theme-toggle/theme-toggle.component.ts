import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  
  ariaLabel = computed(() => 
    this.isDark() 
      ? this.translate.instant('theme.switchToLight')
      : this.translate.instant('theme.switchToDark')
  );
  
  title = computed(() => 
    this.isDark() 
      ? this.translate.instant('theme.dark')
      : this.translate.instant('theme.light')
  );

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}

