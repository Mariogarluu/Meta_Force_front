import { Injectable, signal, computed } from '@angular/core';

/** Temas visuales permitidos formalmente en el empaquetado del compilador de UI */
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
  /** Signal interna estricta reaccionando al frame inicial u hoja de estilo */
  private _theme = signal<Theme>(this.getInitialTheme());
  
  /** Signal reactiva inyectando estado de solo lectura (read-only state) público */
  public readonly theme = this._theme.asReadonly();
  /** Variante reactiva de la constatación de si nos encontramos en tema oscurecido */
  public readonly isDark = computed(() => this._theme() === 'dark');
  /** Variante reactiva de la constatación de si nos encontramos en tema aclarado (blanco) */
  public readonly isLight = computed(() => this._theme() === 'light');

  /**
   * Arranque de infraestructura delegando sobre la inferencia del storage.
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
   * Invierte dinámicamente entre estado lumínico blanco (light) y opaco (dark).
   */
  toggleTheme() {
    const newTheme: Theme = this._theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Impone sobre escrutinio el tema gráfico actualizandi el tag html en vivo y persistiendo el storage de red.
   * @param theme - Identificador semántico de variante grafica
   */
  setTheme(theme: Theme) {
    this._theme.set(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }
}


