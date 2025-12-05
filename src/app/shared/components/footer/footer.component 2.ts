import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly quickLinks = [
    { label: 'Inicio', path: '/home' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Centros', path: '/centers' },
    { label: 'Usuarios', path: '/users' }
  ];

  readonly resources = [
    { label: 'Entrenadores', path: '/home#trainers' },
    { label: 'Dietas', path: '/home#diets' },
    { label: 'Planes', path: '/home#plans' }
  ];
}

