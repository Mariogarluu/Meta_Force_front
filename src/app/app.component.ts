import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { ErrorToastComponent } from './shared/components/error-toast/error-toast.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from './core/services/translation.service';

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

  constructor() {
    // Asegurar que ngx-translate tenga un idioma por defecto
    this.translateService.setDefaultLang('es');
    // Configurar para que muestre la clave si no hay traducción
    this.translateService.setDefaultLang('es');
    // Usar español inmediatamente para que la app funcione
    this.translateService.use('es');
    
    // Cargar traducciones en segundo plano sin bloquear
    setTimeout(() => {
      this.translationService.setLanguage('es').catch(err => {
        console.warn('Error loading translations:', err);
      });
    }, 0);
  }

  ngOnInit() {
    // El servicio de tema se inicializa automáticamente en su constructor
    // pero lo inyectamos aquí para asegurar que se inicialice
  }
}
