import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
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

  readonly currentSlide = signal(0);

  private slideIntervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.clearAutoSlide();
  }

  nextSlide(): void {
    this.currentSlide.update((index) => (index + 1) % this.slides.length);
    this.restartAutoSlide();
  }

  previousSlide(): void {
    this.currentSlide.update((index) => (index - 1 + this.slides.length) % this.slides.length);
    this.restartAutoSlide();
  }

  goToSlide(index: number): void {
    if (index < 0 || index >= this.slides.length) return;
    this.currentSlide.set(index);
    this.restartAutoSlide();
  }

  isPrev(index: number): boolean {
    const prev = (this.currentSlide() - 1 + this.slides.length) % this.slides.length;
    return prev === index;
  }

  isNext(index: number): boolean {
    const next = (this.currentSlide() + 1) % this.slides.length;
    return next === index;
  }

  private startAutoSlide(): void {
    this.slideIntervalId = setInterval(() => this.nextSlide(), 7000);
  }

  private restartAutoSlide(): void {
    this.clearAutoSlide();
    this.startAutoSlide();
  }

  private clearAutoSlide(): void {
    if (this.slideIntervalId) {
      clearInterval(this.slideIntervalId);
      this.slideIntervalId = null;
    }
  }
}

