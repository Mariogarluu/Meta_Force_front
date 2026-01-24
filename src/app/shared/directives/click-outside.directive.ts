import { Directive, ElementRef, EventEmitter, inject, OnDestroy, Output } from '@angular/core';

/**
 * Directiva que detecta clicks fuera del elemento al que está aplicada
 * y emite un evento cuando esto ocurre.
 * 
 * Útil para cerrar dropdowns, modales, menús, etc. cuando el usuario hace clic fuera de ellos.
 * 
 * @example
 * ```html
 * <div (clickOutside)="closeDropdown()">
 *   <!-- Contenido del dropdown -->
 * </div>
 * ```
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective implements OnDestroy {
  private elementRef = inject(ElementRef);
  
  /**
   * Evento que se emite cuando se detecta un click fuera del elemento
   */
  @Output() clickOutside = new EventEmitter<void>();

  private clickListener: ((event: MouseEvent) => void) | null = null;

  constructor() {
    // Usar setTimeout para evitar que el click que activó el dropdown se procese inmediatamente
    setTimeout(() => {
      this.clickListener = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        
        // Verificar si el click fue fuera del elemento
        if (!this.elementRef.nativeElement.contains(target)) {
          this.clickOutside.emit();
        }
      };
      
      document.addEventListener('click', this.clickListener);
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }
}

