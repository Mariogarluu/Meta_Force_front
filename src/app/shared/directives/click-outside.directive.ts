import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

/**
 * Directiva personalizada que emite un evento cuando se hace clic fuera del elemento.
 * Útil para cerrar dropdowns, modales o menús cuando el usuario hace clic en otra parte.
 * 
 * Uso: <div (appClickOutside)="closeMenu()">Menú</div>
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() appClickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  /**
   * Escucha clics en el documento y emite el evento si el clic fue fuera del elemento
   * @param event - Evento de clic del documento
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    
    if (!clickedInside) {
      this.appClickOutside.emit();
    }
  }
}
