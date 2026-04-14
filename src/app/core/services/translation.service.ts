import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { TranslateService as NgxTranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

/** Supported UI languages for internationalization */
export type Language = 'es' | 'en' | 'fr';

/**
 * Service for managing application internationalization (i18n).
 * Handles language switching, translation loading, and persistent user preferences.
 * Supports Spanish (default), English, and French.
 */
@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  /** Current active language signal */
  private _language = signal<Language>('es');
  /** Injected HttpClient for translation file loading fallback */
  private http = inject(HttpClient);
  /** Injected PLATFORM_ID to detect browser environment */
  private platformId = inject(PLATFORM_ID);
  /** Set of languages already loaded into memory */
  private loadedLanguages = new Set<Language>();
  
  /** Public read-only signal of the current language */
  public readonly language = this._language.asReadonly();

  /**
   * Initializes the service by setting Spanish as default and attempting to load saved preference.
   * @param ngxTranslate - Injected ngx-translate service
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
   * Initializes translations by loading Spanish first and then the user's saved language.
   * Ensures Spanish is always available as a fallback.
   * @returns Promise resolving when initial translations are ready
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
   * Loads translations for a specific language using the ngx-translate loader.
   * @param lang - The language code ('es', 'en', or 'fr')
   * @returns Promise resolving when the language is loaded
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
   * Retrieves the initial language from localStorage or defaults to Spanish.
   * @returns The initial language code
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
   * Sets the application language, loads translations if necessary, and persists preference.
   * @param language - The language code to switch to
   * @returns Promise resolving when the language switch is complete
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
   * Synchronously gets a translation by key.
   * @param key - Translation key (e.g., 'auth.login')
   * @param params - Optional interpolation parameters
   * @returns The translated string or the key if not found
   */
  translate(key: string, params?: any): string {
    const translation = this.ngxTranslate.instant(key, params);
    return translation || key;
  }

  /**
   * Short alias for the translate method.
   * @param key - Translation key
   * @param params - Optional interpolation parameters
   * @returns The translated string
   */
  t(key: string, params?: any): string {
    return this.translate(key, params);
  }

  /**
   * Asynchronously gets a translation as an Observable.
   * @param key - Translation key
   * @param params - Optional interpolation parameters
   * @returns Observable emitting the translated string
   */
  get(key: string, params?: any) {
    return this.ngxTranslate.get(key, params);
  }
}
