import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Loader personalizado para cargar las traducciones desde archivos JSON.
 * Busca los archivos en la carpeta assets/i18n/ del proyecto.
 */
class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  /**
   * Carga el archivo de traducción para un idioma específico.
   * @param lang - El código del idioma (es, en, fr)
   * @returns Observable que emite el objeto de traducciones
   */
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`/assets/i18n/${lang}.json`);
  }
}

/**
 * Factory function para crear el loader de traducciones.
 * @param http - Instancia de HttpClient para realizar las peticiones
 * @returns Instancia del CustomTranslateLoader
 */
export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

/**
 * Configuración principal de la aplicación Angular.
 * Incluye la configuración de routing, HTTP client, interceptores y traducciones.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'es',
        fallbackLang: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        },
        useDefaultLang: true
      })
    )
  ]
};
