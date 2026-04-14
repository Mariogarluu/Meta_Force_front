import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language } from '../../../core/services/translation.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

/**
 * Language selector component that allows changing the application's locale.
 * Displays a dropdown with available languages (Spanish, English, French)
 * and automatically closes when clicking outside the component.
 */
@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss'
})
export class LanguageSelectorComponent {
  /** Injected TranslationService for managing the active locale */
  translationService = inject(TranslationService);

  /** Signal exposing the current language code */
  currentLanguage = this.translationService.language;
  /** Internal state tracking the visibility of the language dropdown */
  showDropdown = false;
  
  /**
   * List of available languages with their metadata including ISO code, 
   * display name, and emoji flag representation.
   */
  languages: { code: Language; name: string; flag: string }[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  /**
   * Computed signal that retrieves detailed metadata for the currently active language.
   * Useful for displaying the current flag and name in the selector button.
   */
  currentLanguageInfo = computed(() => {
    return this.languages.find(l => l.code === this.currentLanguage());
  });

  /**
   * Updates the application's language and persists the choice via TranslationService.
   * Closes the dropdown menu immediately after selection.
   * @param language - The target language code to switch to
   */
  selectLanguage(language: Language) {
    this.translationService.setLanguage(language);
    this.showDropdown = false;
  }

  /**
   * Closes the dropdown menu when a click event occurs outside the component's boundaries.
   * Invoked via the ClickOutsideDirective.
   */
  closeDropdown() {
    this.showDropdown = false;
  }
}

