import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { TranslateService as NgxTranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

export type Language = 'es' | 'en' | 'fr';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private _language = signal<Language>('es');
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private loadedLanguages = new Set<Language>();
  
  public readonly language = this._language.asReadonly();

  constructor(private ngxTranslate: NgxTranslateService) {
    if (isPlatformBrowser(this.platformId)) {
      // Configurar español como idioma por defecto SIEMPRE
      this.ngxTranslate.setDefaultLang('es');
      // Usar español inmediatamente para que la app funcione
      this.ngxTranslate.use('es');
      this._language.set('es');
      
      // Cargar traducciones de forma no bloqueante (en segundo plano)
      setTimeout(() => {
        this.initializeTranslations().catch(err => {
          console.warn('Error initializing translations:', err);
        });
      }, 0);
    }
  }

  private async initializeTranslations() {
    try {
      // Siempre cargar español primero
      await this.loadLanguage('es');
      
      // Luego cargar el idioma guardado si es diferente
      const savedLang = this.getInitialLanguage();
      if (savedLang !== 'es') {
        await this.loadLanguage(savedLang);
        this.ngxTranslate.use(savedLang);
        this._language.set(savedLang);
      }
    } catch (error) {
      console.error('Error initializing translations:', error);
      // Asegurar que al menos español esté configurado
      this.ngxTranslate.use('es');
      this._language.set('es');
    }
  }

  private async loadLanguage(lang: Language): Promise<void> {
    if (this.loadedLanguages.has(lang)) {
      return;
    }

    try {
      const response = await this.http.get<any>(`assets/i18n/${lang}.json`).toPromise();
      if (response) {
        this.ngxTranslate.setTranslation(lang, response, true);
        this.loadedLanguages.add(lang);
      }
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      // Si falla, intentar cargar español como fallback solo si no es español
      if (lang !== 'es') {
        if (!this.loadedLanguages.has('es')) {
          try {
            const esResponse = await this.http.get<any>(`assets/i18n/es.json`).toPromise();
            if (esResponse) {
              this.ngxTranslate.setTranslation('es', esResponse, true);
              this.loadedLanguages.add('es');
            }
          } catch (esError) {
            console.error('Error loading Spanish translations:', esError);
          }
        }
      }
    }
  }

  /**
   * Obtiene el idioma inicial desde localStorage o usa 'es' por defecto.
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
    // Por defecto, usar español
    return 'es';
  }

  /**
   * Establece un idioma específico y guarda la preferencia.
   */
  async setLanguage(language: Language) {
    await this.loadLanguage(language);
    this.ngxTranslate.use(language);
    this._language.set(language);
    try {
      localStorage.setItem('language', language);
    } catch (e) {
      console.warn('Error saving language to localStorage:', e);
    }
  }

  /**
   * Obtiene una traducción por su clave.
   */
  translate(key: string, params?: any): string {
    const translation = this.ngxTranslate.instant(key, params);
    // Si no hay traducción, devolver la clave para que no se vea vacío
    return translation || key;
  }

  /**
   * Obtiene una traducción por su clave (método abreviado).
   */
  t(key: string, params?: any): string {
    return this.translate(key, params);
  }

  /**
   * Obtiene una traducción de forma asíncrona (para observables).
   */
  get(key: string, params?: any) {
    return this.ngxTranslate.get(key, params);
  }
}
