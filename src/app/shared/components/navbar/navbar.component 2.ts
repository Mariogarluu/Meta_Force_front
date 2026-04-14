import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Secondary navigation bar component.
 * Used for specific landing pages or alternative layouts.
 */
@Component({
  selector: 'app-navbar2',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component 2.html',
  styleUrl: './navbar.component 2.scss'
})
export class NavbarComponent2 {
  /** 
   * List of static navigation links for the secondary menu.
   * Includes display labels and target routes for landing page contexts.
   */
  readonly navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Clases', path: '/dashboard' },
    { label: 'Entrenadores', path: '/users' },
    { label: 'Membresía', path: '/register' }
  ];
}

