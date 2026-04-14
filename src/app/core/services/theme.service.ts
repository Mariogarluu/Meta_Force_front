import { Injectable, signal, computed } from '@angular/core';

/** Supported visual themes for the application */
export type Theme = 'dark' | 'light';

/**
 * Service managing the application's visual theme (light/dark mode).
 * Persists user preference and applies the 'dark' class to the HTML document.
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
   * Retrieves the initial theme from localStorage or defaults to 'dark'.
   * @returns The initial theme for the application
   */
  private getInitialTheme(): Theme {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      return saved;
    }
    return 'dark';
  }

  /**
   * Applies the theme to the HTML document by adding/removing the 'dark' class.
   * @param theme - The theme to apply ('dark' or 'light')
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


