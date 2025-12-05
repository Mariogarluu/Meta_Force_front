import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { TranslateService as NgxTranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

export type Language = 'es' | 'en' | 'fr';

/**
 * Servicio de traducción que gestiona la internacionalización de la aplicación.
 * Utiliza ngx-translate para cargar y gestionar traducciones en múltiples idiomas.
 * Soporta español (por defecto), inglés y francés.
 * Las traducciones se cargan desde archivos JSON en assets/i18n/.
 */
@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private _language = signal<Language>('es');
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private loadedLanguages = new Set<Language>();
  
  public readonly language = this._language.asReadonly();

  /**
   * Inicializa el servicio configurando español como idioma por defecto.
   * Carga las traducciones de forma asíncrona y no bloqueante.
   */
  constructor(private ngxTranslate: NgxTranslateService) {
    if (isPlatformBrowser(this.platformId)) {
      this.ngxTranslate.setDefaultLang('es');
      this.ngxTranslate.use('es');
      this._language.set('es');
      
      setTimeout(() => {
        this.initializeTranslations().catch(err => {
          console.warn('Error initializing translations:', err);
        });
      }, 0);
    }
  }

  /**
   * Inicializa las traducciones cargando primero español y luego el idioma guardado.
   * Si hay algún error, asegura que español esté siempre disponible como fallback.
   */
  private async initializeTranslations() {
    try {
      const savedLang = this.getInitialLanguage();
      await firstValueFrom(this.ngxTranslate.use(savedLang));
      this._language.set(savedLang);
      this.loadedLanguages.add(savedLang);
    } catch (error) {
      console.error('Error initializing translations:', error);
      try {
        await firstValueFrom(this.ngxTranslate.use('es'));
        this._language.set('es');
        this.loadedLanguages.add('es');
      } catch (esError) {
        console.error('Error loading Spanish translations:', esError);
      }
    }
  }

  /**
   * Carga las traducciones de un idioma específico usando el loader de ngx-translate.
   * El loader se encarga de cargar los archivos JSON automáticamente.
   * @param lang - El idioma a cargar ('es', 'en' o 'fr')
   */
  private async loadLanguage(lang: Language): Promise<void> {
    if (this.loadedLanguages.has(lang)) {
      return;
    }

    try {
      await firstValueFrom(this.ngxTranslate.use(lang));
      this.loadedLanguages.add(lang);
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      if (lang !== 'es') {
        try {
          await firstValueFrom(this.ngxTranslate.use('es'));
          this.loadedLanguages.add('es');
        } catch (esError) {
          console.error('Error loading Spanish translations:', esError);
        }
      }
    }
  }

  /**
   * Obtiene el idioma inicial desde localStorage o retorna 'es' por defecto.
   * Valida que el idioma guardado sea uno de los soportados.
   * @returns El idioma inicial válido o 'es' por defecto
   */
  private getInitialLanguage(): Language {
    try {
      const saved = localStorage.getItem('language') as Language;
      if (saved && (saved === 'es' || saved === 'en' || saved === 'fr')) {
        return saved;
      }
    } catch (e) {
      console.warn('Error reading language from localStorage:', e);
    }
    return 'es';
  }

  /**
   * Establece un idioma específico, carga sus traducciones si es necesario,
   * actualiza el servicio de traducción y guarda la preferencia en localStorage.
   * @param language - El idioma a establecer ('es', 'en' o 'fr')
   */
  async setLanguage(language: Language) {
    try {
      await firstValueFrom(this.ngxTranslate.use(language));
      this._language.set(language);
      this.loadedLanguages.add(language);
      try {
        localStorage.setItem('language', language);
      } catch (e) {
        console.warn('Error saving language to localStorage:', e);
      }
    } catch (error) {
      console.error(`Error setting language to ${language}:`, error);
      this.ngxTranslate.use('es');
      this._language.set('es');
    }
  }

  /**
   * Obtiene una traducción instantánea por su clave.
   * Si no existe la traducción, retorna la clave para evitar textos vacíos.
   * @param key - La clave de traducción (ej: 'common.save')
   * @param params - Parámetros opcionales para interpolación en la traducción
   * @returns La traducción o la clave si no existe
   */
  translate(key: string, params?: any): string {
    const translation = this.ngxTranslate.instant(key, params);
    return translation || key;
  }

  /**
   * Método abreviado para obtener una traducción instantánea.
   * @param key - La clave de traducción
   * @param params - Parámetros opcionales para interpolación
   * @returns La traducción o la clave si no existe
   */
  t(key: string, params?: any): string {
    return this.translate(key, params);
  }

  /**
   * Obtiene una traducción de forma asíncrona mediante un Observable.
   * Útil cuando se necesita esperar a que las traducciones estén cargadas.
   * @param key - La clave de traducción
   * @param params - Parámetros opcionales para interpolación
   * @returns Un Observable que emite la traducción
   */
  get(key: string, params?: any) {
    return this.ngxTranslate.get(key, params);
  }
}
