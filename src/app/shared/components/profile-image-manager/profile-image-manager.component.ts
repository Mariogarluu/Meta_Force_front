import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente para gestionar la imagen de perfil del usuario.
 * Permite subir una nueva imagen o eliminar la existente.
 */
@Component({
  selector: 'app-profile-image-manager',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './profile-image-manager.component.html',
  styleUrl: './profile-image-manager.component.scss'
})
export class ProfileImageManagerComponent {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);

  showMenu = signal(false);
  isUploading = signal(false);
  errorMessage = signal<string>('');

  /**
   * Maneja la selección de un archivo de imagen.
   * Valida que sea una imagen y la sube a Cloudinary.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor, selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('La imagen no debe superar los 5MB');
      return;
    }

    this.uploadImage(file);
    input.value = '';
  }

  /**
   * Sube la imagen de perfil a Cloudinary.
   * @param file - Archivo de imagen a subir
   */
  private uploadImage(file: File): void {
    this.isUploading.set(true);
    this.errorMessage.set('');
    this.showMenu.set(false);

    this.usersService.uploadProfileImage(file).subscribe({
      next: (updatedUser) => {
        this.isUploading.set(false);
        this.authService.refreshUser();
      },
      error: (error) => {
        this.isUploading.set(false);
        this.errorMessage.set(error.error?.message || 'Error al subir la imagen');
      }
    });
  }

  /**
   * Elimina la imagen de perfil del usuario.
   */
  deleteImage(): void {
    if (!confirm('¿Estás seguro de que quieres eliminar tu imagen de perfil?')) {
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set('');
    this.showMenu.set(false);

    this.usersService.deleteProfileImage().subscribe({
      next: (updatedUser) => {
        this.isUploading.set(false);
        this.authService.refreshUser();
      },
      error: (error) => {
        this.isUploading.set(false);
        this.errorMessage.set(error.error?.message || 'Error al eliminar la imagen');
      }
    });
  }

  /**
   * Alterna la visibilidad del menú de gestión de imagen.
   */
  toggleMenu(): void {
    this.showMenu.set(!this.showMenu());
  }

  /**
   * Cierra el menú de gestión de imagen.
   */
  closeMenu(): void {
    this.showMenu.set(false);
  }
}

