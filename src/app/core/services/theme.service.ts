import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _theme = signal<Theme>(this.getInitialTheme());
  
  public readonly theme = this._theme.asReadonly();
  public readonly isDark = computed(() => this._theme() === 'dark');
  public readonly isLight = computed(() => this._theme() === 'light');

  constructor() {
    this.applyTheme(this._theme());
  }

  /**
   * Obtiene el tema inicial desde localStorage o usa 'dark' por defecto.
   */
  private getInitialTheme(): Theme {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      return saved;
    }
    // Por defecto, usar dark mode
    return 'dark';
  }

  /**
   * Aplica el tema al documento HTML agregando o removiendo la clase 'dark'.
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
   * Cambia el tema entre dark y light, guarda la preferencia y la aplica.
   */
  toggleTheme() {
    const newTheme: Theme = this._theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Establece un tema específico, guarda la preferencia y la aplica.
   */
  setTheme(theme: Theme) {
    this._theme.set(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }
}

