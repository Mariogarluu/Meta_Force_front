import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

/**
 * Public-facing landing page component (v2).
 * Features a dynamic hero slider, service highlights, and global navigation.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  /** Array of images and metadata for the hero carousel */
  readonly slides = [
    {
      image: 'https://images.unsplash.com/photo-1571731956672-b07085807167?auto=format&fit=crop&w=1600&q=80',
      alt: 'Área de pesas y máquinas'
    },
    {
      image: 'https://images.unsplash.com/photo-1434754205268-ad3b5f549b11?auto=format&fit=crop&w=1600&q=80',
      alt: 'Entrenador asistiendo cliente'
    },
    {
      image: 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?auto=format&fit=crop&w=1600&q=80',
      alt: 'Sala de cardio moderna'
    }
  ];

  /** Core services featured on the home page */
  readonly services = [
    {
      label: 'Entrenamiento',
      description: 'Optimiza tus rutinas con seguimiento y máquinas inteligentes.',
      path: '/dashboard'
    },
    {
      label: 'Entrenadores',
      description: 'Gestiona tu staff, horarios y clases con total control.',
      path: '/users'
    },
    {
      label: 'Dietas',
      description: 'Planes personalizados que acompañan cada entrenamiento.',
      path: '/register'
    }
  ];

  /** Signal tracking the index of the currently active slide */
  readonly currentSlide = signal(0);

  /** Internal handle for the auto-sliding interval */
  private slideIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Initializes the component and starts the automatic slide transition.
   */
  ngOnInit(): void {
    this.startAutoSlide();
  }

  /**
   * Cleanup logic. Stops the auto-slide timer to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.clearAutoSlide();
  }

  /**
   * Transitions to the next slide in the carousel.
   */
  nextSlide(): void {
    this.currentSlide.update((index) => (index + 1) % this.slides.length);
    this.restartAutoSlide();
  }

  /**
   * Transitions to the previous slide in the carousel.
   */
  previousSlide(): void {
    this.currentSlide.update((index) => (index - 1 + this.slides.length) % this.slides.length);
    this.restartAutoSlide();
  }

  /**
   * Jumps to a specific slide index.
   * @param index - The index of the slide to display
   */
  goToSlide(index: number): void {
    if (index < 0 || index >= this.slides.length) return;
    this.currentSlide.set(index);
    this.restartAutoSlide();
  }

  /**
   * Checks if the given index is the previous slide relative to the current one.
   * @param index - The index to check
   * @returns true if it is the previous slide
   */
  isPrev(index: number): boolean {
    const prev = (this.currentSlide() - 1 + this.slides.length) % this.slides.length;
    return prev === index;
  }

  /**
   * Checks if the given index is the next slide relative to the current one.
   * @param index - The index to check
   * @returns true if it is the next slide
   */
  isNext(index: number): boolean {
    const next = (this.currentSlide() + 1) % this.slides.length;
    return next === index;
  }

  /**
   * Starts the automatic sliding mechanism (7-second interval).
   */
  private startAutoSlide(): void {
    this.slideIntervalId = setInterval(() => this.nextSlide(), 7000);
  }

  /**
   * Restarts the auto-slide timer after a manual interaction.
   */
  private restartAutoSlide(): void {
    this.clearAutoSlide();
    this.startAutoSlide();
  }

  /**
   * Clears the active slide interval.
   */
  private clearAutoSlide(): void {
    if (this.slideIntervalId) {
      clearInterval(this.slideIntervalId);
      this.slideIntervalId = null;
    }
  }
}

