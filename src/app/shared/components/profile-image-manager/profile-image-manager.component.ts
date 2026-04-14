import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Component for managing the user's profile image.
 * Provides functionality to upload new images via Cloudinary and delete existing ones.
 */
@Component({
  selector: 'app-profile-image-manager',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './profile-image-manager.component.html',
  styleUrl: './profile-image-manager.component.scss'
})
export class ProfileImageManagerComponent {
  /** Injected UsersService for profile-specific API operations */
  private usersService = inject(UsersService);
  /** Injected AuthService to refresh local session data after image updates */
  private authService = inject(AuthService);

  /** Signal controlling the visibility of the image management dropdown menu */
  showMenu = signal(false);
  /** Signal indicating an active upload or deletion process */
  isUploading = signal(false);
  /** Signal for storing and displaying operation-specific error messages */
  errorMessage = signal<string>('');

  /**
   * Handles the selection of an image file from the system dialog.
   * Validates file type and size constraints before initiating the upload.
   * @param event - The DOM event from the file input change
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('Image size should not exceed 5MB');
      return;
    }

    this.uploadImage(file);
    input.value = '';
  }

  /**
   * Uploads the selected profile image to the server via Cloudinary.
   * Refreshes the user session upon successful completion.
   * @param file - The Image file object to be uploaded
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
        this.errorMessage.set(error.error?.message || 'Error uploading image');
      }
    });
  }

  /**
   * Deletes the user's current profile image.
   * Prompts for confirmation and resets the view state.
   */
  deleteImage(): void {
    if (!confirm('Are you sure you want to delete your profile image?')) {
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set('');
    this.showMenu.set(false);

    this.usersService.deleteProfileImage().subscribe({
      next: (updatedUser) => {
        this.isUploading.set(false);
        this.authService.refreshUser();
        // After deletion, automatically open the selector to upload a new image
        setTimeout(() => {
          this.triggerFileInput();
        }, 300);
      },
      error: (error) => {
        this.isUploading.set(false);
        this.errorMessage.set(error.error?.message || 'Error deleting image');
      }
    });
  }

  /**
   * Programmatically triggers a hidden file input to open the system's file picker.
   * Includes inline validation for redundancy.
   */
  triggerFileInput(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          this.errorMessage.set('Please select a valid image file');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage.set('Image size should not exceed 5MB');
          return;
        }
        this.uploadImage(file);
      }
    };
    input.click();
  }

  /**
   * Toggles the visibility state of the local management menu.
   */
  toggleMenu(): void {
    this.showMenu.set(!this.showMenu());
  }

  /**
   * Forcefully closes the management menu.
   */
  closeMenu(): void {
    this.showMenu.set(false);
  }
}

