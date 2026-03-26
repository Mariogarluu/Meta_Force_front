import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// Imports de Seguridad y Rutas
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { GlobalErrorHandler } from './core/handlers/global-error-handler';

/**
 * Loader personalizado para cargar las traducciones desde archivos JSON.
 */
class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) { }

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`/assets/i18n/${lang}.json`);
  }
}

/**
 * Factory function para crear el loader de traducciones.
 */
export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

/**
 * Configuración principal de la aplicación Angular.
 * Integra: Seguridad (Error Handler + Interceptors) + I18n + Routing
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),

    // HTTP Client con Fetch API y Interceptor de Auth (Seguridad de Transporte)
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),

    // Configuración de Idiomas (Preservada)
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ),

    // GESTIÓN GLOBAL DE ERRORES (Seguridad Anti-Divulgación)
    // Suprime stack traces en producción y centraliza el manejo de fallos
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};