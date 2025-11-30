import { Component, inject, HostListener, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language } from '../../../core/services/translation.service';

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
  
  languages: { code: Language; name: string; flag: string }[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  currentLanguageInfo = computed(() => {
    return this.languages.find(l => l.code === this.currentLanguage());
  });

  selectLanguage(language: Language) {
    this.translationService.setLanguage(language);
    this.showDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}

