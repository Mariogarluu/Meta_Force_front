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
export class AppComponent implements OnInit {
  title = 'credentials';
  private themeService = inject(ThemeService);
  private translationService = inject(TranslationService);
  private translateService = inject(TranslateService);

  /**
   * Inicializa el componente asegurando que las traducciones estén configuradas.
   * Configura español como idioma por defecto y carga las traducciones.
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
   * Hook del ciclo de vida que se ejecuta después de la inicialización.
   * Asegura que los servicios estén completamente inicializados.
   */
  ngOnInit() {
  }
}
