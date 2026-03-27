import { Component, inject, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Component for generating and displaying the user's personal access QR code.
 * 
 * The QR contains JSON-encoded user identity (ID, email, name) and a dynamic timestamp
 * that rotates every 20 minutes to prevent spoofing and ensure validity. 
 * Center IDs are excluded as users may have access to multiple facilities.
 * 
 * Features:
 * - Automatic rotation every 20 minutes
 * - Adaptive light/dark mode color palettes
 * - PNG download capability with branded overlay
 * - Backend-enforced expiration validation
 */
@Component({
  selector: 'app-qr',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent, LanguageSelectorComponent, TranslateModule],
  templateUrl: './qr.component.html',
  styleUrl: './qr.component.scss'
})
export class QrComponent implements OnInit, OnDestroy {
  /** Injected AuthService for user identity context */
  auth = inject(AuthService);
  
  /** Signal for the currently authenticated user session */
  currentUser = this.auth.currentUser;
  /** Computed signal tracking loading state if user data is missing */
  isLoading = computed(() => !this.currentUser());
  /** Internal handle for the 20-minute refresh timer */
  private refreshInterval: any;

  /**
   * Current QR generation timestamp, updated every 20 minutes.
   * Used as a salt to ensure QR codes are short-lived and verifiable.
   */
  qrTimestamp = signal<string>(new Date().toISOString());

  /**
   * Generates the raw JSON payload for the QR code.
   * 
   * Payload includes:
   * - id: User UUID
   * - email: Account email
   * - name: Full display name
   * - timestamp: ISO string of generation time
   * 
   * @returns A JSON-encoded string for the QR engine
   */
  qrData = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      timestamp: this.qrTimestamp()
    };
    
    return JSON.stringify(userData);
  });

  /**
   * Resolves the QR image URL for light theme application.
   * Uses dark blue on white for high contrast.
   * 
   * @returns QR Server API URL for light mode
   */
  qrUrl = computed(() => {
    const data = this.qrData();
    if (!data) return '';
    
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&color=30-64-175&bgcolor=255-255-255&margin=1&ecc=M`;
  });

  /**
   * Resolves the QR image URL for dark theme application.
   * Uses light cyan on dark slate for high contrast.
   * 
   * @returns QR Server API URL for dark mode
   */
  qrUrlDark = computed(() => {
    const data = this.qrData();
    if (!data) return '';
    
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&color=34-211-238&bgcolor=30-41-59&margin=1&ecc=M`;
  });

  /**
   * Initialization logic. Starts the 20-minute rotation interval.
   */
  ngOnInit() {
    this.refreshInterval = setInterval(() => {
      this.qrTimestamp.set(new Date().toISOString());
    }, 20 * 60 * 1000);
  }

  /**
   * Cleanup logic. Disposes of the refresh timer to prevent memory leaks.
   */
  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Merges the QR code with branding and user identity into a downloadable PNG.
   * 
   * Process:
   * 1. Detects current document theme (light/dark)
   * 2. Draws QR image onto a 400x500 canvas
   * 3. Adds user name and gym branding text
   * 4. Triggers an automatic browser download
   */
  downloadQR() {
    const user = this.currentUser();
    if (!user) return;

    // Crear un canvas para combinar ambas imágenes o usar la del tema actual
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Detectar si está en modo oscuro
    const isDark = document.documentElement.classList.contains('dark');
    const qrImageUrl = isDark ? this.qrUrlDark() : this.qrUrl();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 500;

      // Fondo blanco o oscuro según el tema
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar el QR
      ctx.drawImage(img, 50, 50, 300, 300);

      // Agregar texto
      ctx.fillStyle = isDark ? '#ffffff' : '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(user.name, canvas.width / 2, 380);
      ctx.font = '14px Arial';
      ctx.fillText('Meta Force Gym', canvas.width / 2, 410);

      // Convertir a imagen y descargar
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${user.name}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };

    img.src = qrImageUrl;
  }
}

