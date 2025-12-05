import { Component, inject, HostListener, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language } from '../../../core/services/translation.service';

/**
 * Componente selector de idioma que permite cambiar el idioma de la aplicación.
 * Muestra un dropdown con los idiomas disponibles (Español, Inglés, Francés)
 * y cierra automáticamente al hacer clic fuera del componente.
 */
@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss'
})
export class LanguageSelectorComponent {
  translationService = inject(TranslationService);
  private elementRef = inject(ElementRef);

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
   * Listener que detecta clics fuera del componente para cerrar el dropdown.
   * @param event - El evento de clic del documento
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}

