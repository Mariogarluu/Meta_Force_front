import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'dark' | 'light';

/**
 * Servicio que gestiona el tema de la aplicación (modo claro/oscuro).
 * Persiste la preferencia del usuario en localStorage y aplica el tema
 * al documento HTML mediante la clase 'dark' de Tailwind CSS.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _theme = signal<Theme>(this.getInitialTheme());
  
  public readonly theme = this._theme.asReadonly();
  public readonly isDark = computed(() => this._theme() === 'dark');
  public readonly isLight = computed(() => this._theme() === 'light');

  /**
   * Inicializa el servicio aplicando el tema guardado o el tema por defecto.
   */
  constructor() {
    this.applyTheme(this._theme());
  }

  /**
   * Obtiene el tema inicial desde localStorage o retorna 'dark' por defecto.
   * @returns El tema guardado o 'dark' si no hay preferencia guardada
   */
  private getInitialTheme(): Theme {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      return saved;
    }
    return 'dark';
  }

  /**
   * Aplica el tema al documento HTML agregando o removiendo la clase 'dark'.
   * Esta clase es utilizada por Tailwind CSS para aplicar los estilos del modo oscuro.
   * @param theme - El tema a aplicar ('dark' o 'light')
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
   * Alterna entre modo oscuro y claro.
   * Guarda la nueva preferencia y la aplica inmediatamente.
   */
  toggleTheme() {
    const newTheme: Theme = this._theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Establece un tema específico, guarda la preferencia en localStorage y la aplica.
   * @param theme - El tema a establecer ('dark' o 'light')
   */
  setTheme(theme: Theme) {
    this._theme.set(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }
}

