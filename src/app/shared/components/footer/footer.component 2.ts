import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Global footer component.
 * Displays site navigation links, resources, and social information.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  /** 
   * Main navigation links for the footer.
   * Provides quick access to internal application routes.
   */
  readonly quickLinks = [
    { label: 'Inicio', path: '/home' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Centros', path: '/centers' },
    { label: 'Usuarios', path: '/users' }
  ];

  /** 
   * Resource and anchor links for the footer.
   * Useful for internal page navigation and external references.
   */
  readonly resources = [
    { label: 'Entrenadores', path: '/home#trainers' },
    { label: 'Dietas', path: '/home#diets' },
    { label: 'Planes', path: '/home#plans' }
  ];
}

