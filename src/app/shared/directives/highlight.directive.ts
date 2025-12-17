import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

/**
 * Directiva personalizada que añade un efecto de resaltado al hacer hover sobre un elemento.
 * Permite personalizar el color de resaltado mediante el input appHighlight.
 * 
 * Uso: <div appHighlight="yellow">Contenido</div>
 * Uso con color personalizado: <div [appHighlight]="'#4ade80'">Contenido</div>
 */
@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective {
  @Input() appHighlight = '#fef08a'; // Color amarillo claro por defecto
  
  private originalBackground: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  /**
   * Guarda el color de fondo original cuando se monta la directiva
   */
  ngOnInit() {
    this.originalBackground = this.el.nativeElement.style.backgroundColor;
  }

  /**
   * Aplica el color de resaltado cuando el mouse entra en el elemento
   */
  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.appHighlight);
  }

  /**
   * Restaura el color original cuando el mouse sale del elemento
   */
  @HostListener('mouseleave') onMouseLeave() {
    this.highlight(this.originalBackground || 'transparent');
  }

  /**
   * Aplica un color de fondo al elemento
   * @param color - Color a aplicar en formato CSS
   */
  private highlight(color: string) {
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', color);
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'background-color 0.3s ease');
  }
}
