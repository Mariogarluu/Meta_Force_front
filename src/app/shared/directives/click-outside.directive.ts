import { Directive, ElementRef, EventEmitter, inject, OnDestroy, Output } from '@angular/core';

/**
 * Directive that detects and emits events when a click occurs outside of the host element.
 * Useful for closing dropdowns, modals, and menus when the user clicks elsewhere.
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective implements OnDestroy {
  /** Injected ElementRef to access the host element's DOM node */
  private elementRef = inject(ElementRef);
  
  /**
   * Event emitted when a click is detected outside the host element.
   * Useful for triggering closure of dropdowns or modals.
   */
  @Output() clickOutside = new EventEmitter<void>();

  /** Internal reference to the document-level click listener for proper lifecycle cleanup */
  private clickListener: ((event: MouseEvent) => void) | null = null;

  /**
   * Initializes the directive and sets up a global click listener.
   * Uses a micro-task delay (setTimeout 0) to avoid immediate triggering from the opening event.
   */
  constructor() {
    /**
     * Using setTimeout(0) to ensure the click that may have opened the 
     * element (e.g., a toggle button) doesn't immediately trigger 
     * the outside click logic.
     */
    setTimeout(() => {
      this.clickListener = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        
        // Check if the click target is descendant of the host element
        if (!this.elementRef.nativeElement.contains(target)) {
          this.clickOutside.emit();
        }
      };
      
      document.addEventListener('click', this.clickListener);
    }, 0);
  }

  /**
   * Cleanup logic. Removes the global document click listener.
   */
  ngOnDestroy(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }
}
