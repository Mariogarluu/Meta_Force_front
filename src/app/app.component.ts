import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { ErrorToastComponent } from './shared/components/error-toast/error-toast.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from './core/services/translation.service';

/**
 * Componente raíz de la aplicación.
 * Inicializa los servicios principales y asegura que las traducciones estén cargadas.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ErrorToastComponent, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
/**
 * Root component of the MetaForce application.
 * Orchestrates core service initialization and ensures translation bundles are correctly loaded.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ErrorToastComponent, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  /** Internal application title identifier */
  title = 'credentials';
  /** Injected ThemeService for system-wide light/dark mode persistence */
  private themeService = inject(ThemeService);
  /** Injected TranslationService for high-level language management */
  private translationService = inject(TranslationService);
  /** Injected TranslateService from ngx-translate for reactive UI labels */
  private translateService = inject(TranslateService);

  /**
   * Application constructor.
   * Sets the default language to Spanish ('es') and initiates the translation loading process.
   */
  constructor() {
    this.translateService.setDefaultLang('es');
    this.translateService.use('es').subscribe({
      next: () => {
        console.log('Translations loaded successfully');
      },
      error: (err) => {
        console.error('Error loading translations:', err);
      }
    });
  }

  /**
   * Component initialization lifecycle hook.
   * Ensures that all global state providers are stable before UI rendering.
   */
  ngOnInit() {
  }
}
