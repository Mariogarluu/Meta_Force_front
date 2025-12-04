import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  readonly navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Clases', path: '/dashboard' },
    { label: 'Entrenadores', path: '/users' },
    { label: 'Membresía', path: '/register' }
  ];
}

