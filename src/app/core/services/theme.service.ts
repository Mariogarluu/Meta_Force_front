import { Injectable, signal, computed } from '@angular/core';

/** Supported visual themes for the application */
export type Theme = 'dark' | 'light';

/**
 * =============================================================================
 * SERVICIO DE TEMAS (THEME SERVICE)
 * =============================================================================
 * Gestiona la apariencia visual de la aplicación (modo oscuro / modo claro).
 * Persiste la preferencia del usuario en el almacenamiento local y manipula 
 * directamente las clases CSS del documento raíz para aplicar los estilos.
 * 
 * Utiliza Angular Signals para una reactividad eficiente en toda la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  /** Internal signal for the current theme */
  private _theme = signal<Theme>(this.getInitialTheme());
  
  /** Public read-only signal of the current theme */
  public readonly theme = this._theme.asReadonly();
  /** Computed signal returns true if dark mode is active */
  public readonly isDark = computed(() => this._theme() === 'dark');
  /** Computed signal returns true if light mode is active */
  public readonly isLight = computed(() => this._theme() === 'light');

  /**
   * Initializes the service by applying the stored or default theme.
   */
  constructor() {
    this.applyTheme(this._theme());
  }

  /**
   * Recupera el tema inicial guardado.
   * Consulta el localStorage para recuperar la última preferencia.
   * Por defecto utiliza el modo oscuro ('dark').
   * 
   * @returns El tema inicial cargado.
   */
  private getInitialTheme(): Theme {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      return saved;
    }
    return 'dark';
  }

  /**
   * Aplica físicamente el tema al elemento raíz de la aplicación.
   * Añade o elimina la clase CSS 'dark' al <html>.
   * 
   * @param theme - El tema a aplicar ('dark' o 'light').
   */
  private applyTheme(theme: Theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  /**
   * Toggles between dark and light modes.
   */
  toggleTheme() {
    const newTheme: Theme = this._theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Sets a specific theme, saves to localStorage, and applies it to the document.
   * @param theme - The theme to set
   */
  setTheme(theme: Theme) {
    this._theme.set(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }
}


