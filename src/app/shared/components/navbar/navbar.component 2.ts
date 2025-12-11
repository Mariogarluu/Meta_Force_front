import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar2',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component 2.html',
  styleUrl: './navbar.component 2.scss'
})
export class NavbarComponent2 {
  readonly navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Clases', path: '/dashboard' },
    { label: 'Entrenadores', path: '/users' },
    { label: 'Membresía', path: '/register' }
  ];
}

