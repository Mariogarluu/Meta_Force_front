import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Home page component providing a public-facing overview of the gym's services.
 * Features an automatic image slider and service highlights.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  /** Injected TranslateService for internationalization */
  private translateService = inject(TranslateService);
  
  /** 
   * Array of hero section slides.
   * Each slide contains an image URL and an accessibility alt text.
   */
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

  /** 
   * List of highlight services to display on the home page.
   * Includes translation keys for labels and descriptions, and navigation paths.
   */
  readonly services = [
    {
      labelKey: 'home.services.training.title',
      descriptionKey: 'home.services.training.description',
      path: '/dashboard'
    },
    {
      labelKey: 'home.services.trainers.title',
      descriptionKey: 'home.services.trainers.description',
      path: '/users'
    },
    {
      labelKey: 'home.services.diets.title',
      descriptionKey: 'home.services.diets.description',
      path: '/register'
    }
  ];

  /** Signal tracking the index of the currently active hero slide */
  readonly currentSlide = signal(0);

  /** Internal reference to the auto-slide timer */
  private slideIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Component initialization. Starts the automatic slideshow.
   */
  ngOnInit(): void {
    this.startAutoSlide();
  }

  /**
   * Component cleanup. Stops the automatic slideshow to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.clearAutoSlide();
  }

  /**
   * Advances the slideshow to the next image.
   */
  nextSlide(): void {
    this.currentSlide.update((index) => (index + 1) % this.slides.length);
    this.restartAutoSlide();
  }

  /**
   * Reverts the slideshow to the previous image.
   */
  previousSlide(): void {
    this.currentSlide.update((index) => (index - 1 + this.slides.length) % this.slides.length);
    this.restartAutoSlide();
  }

  /**
   * Navigates directly to a specific slide index.
   * @param index - The target slide index (0-based)
   */
  goToSlide(index: number): void {
    if (index < 0 || index >= this.slides.length) return;
    this.currentSlide.set(index);
    this.restartAutoSlide();
  }

  /**
   * Logic to determine if a slide should have 'previous' styling/positioning.
   * @param index - Index of the slide to check
   * @returns True if the slide is the one immediately preceding the current one
   */
  isPrev(index: number): boolean {
    const prev = (this.currentSlide() - 1 + this.slides.length) % this.slides.length;
    return prev === index;
  }

  /**
   * Logic to determine if a slide should have 'next' styling/positioning.
   * @param index - Index of the slide to check
   * @returns True if the slide is the one immediately following the current one
   */
  isNext(index: number): boolean {
    const next = (this.currentSlide() + 1) % this.slides.length;
    return next === index;
  }

  /**
   * Initializes the 7-second automatic interval for slide transitions.
   */
  private startAutoSlide(): void {
    this.slideIntervalId = setInterval(() => this.nextSlide(), 7000);
  }

  /**
   * Resets the auto-slide timer when a manual transition occurs.
   */
  private restartAutoSlide(): void {
    this.clearAutoSlide();
    this.startAutoSlide();
  }

  /**
   * Stops and clears the current auto-slide timer.
   */
  private clearAutoSlide(): void {
    if (this.slideIntervalId) {
      clearInterval(this.slideIntervalId);
      this.slideIntervalId = null;
    }
  }
}

