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
 * Custom loader to fetch translation bundles from JSON files via HTTP.
 * Implements the TranslateLoader interface for ngx-translate.
 */
class CustomTranslateLoader implements TranslateLoader {
  /** 
   * Injected HttpClient used for remote file fetching.
   * @type {HttpClient}
   */
  private http: HttpClient;

  /**
   * Constructs the custom loader.
   * @param http - The Angular HttpClient to use for requests
   */
  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Retrieves the translation object for a specific language code.
   * @param lang - The language code (e.g., 'en', 'es')
   * @returns Observable containing the translation schema
   */
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`/assets/i18n/${lang}.json`);
  }
}

/**
 * Factory function to instantiate the CustomTranslateLoader.
 * @param http - Injected HttpClient dependency
 * @returns An instance of CustomTranslateLoader
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