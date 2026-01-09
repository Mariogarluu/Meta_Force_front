import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language } from '../../../core/services/translation.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

/**
 * Componente selector de idioma que permite cambiar el idioma de la aplicación.
 * Muestra un dropdown con los idiomas disponibles (Español, Inglés, Francés)
 * y cierra automáticamente al hacer clic fuera del componente.
 */
@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss'
})
export class LanguageSelectorComponent {
  translationService = inject(TranslationService);

  currentLanguage = this.translationService.language;
  showDropdown = false;
  
  /**
   * Lista de idiomas disponibles con su código, nombre y bandera.
   */
  languages: { code: Language; name: string; flag: string }[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  /**
   * Computed signal que obtiene la información del idioma actual.
   * Incluye el nombre y la bandera correspondiente.
   */
  currentLanguageInfo = computed(() => {
    return this.languages.find(l => l.code === this.currentLanguage());
  });

  /**
   * Selecciona un idioma y actualiza el servicio de traducción.
   * Cierra el dropdown después de la selección.
   * @param language - El código del idioma a seleccionar
   */
  selectLanguage(language: Language) {
    this.translationService.setLanguage(language);
    this.showDropdown = false;
  }

  /**
   * Cierra el dropdown cuando se hace clic fuera del componente.
   * Se llama desde la directiva ClickOutsideDirective.
   */
  closeDropdown() {
    this.showDropdown = false;
  }
}

