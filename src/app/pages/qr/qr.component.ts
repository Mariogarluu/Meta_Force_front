import { Component, inject, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { User } from '../../core/models/user';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Component for generating and displaying the user's personal access QR code.
 * 
 * The QR contains either:
 * - A secure HS256 signed JWT token from the `qr-sign` Edge Function (expiring in 15 mins).
 * - A legacy JSON‑encoded user identity (ID, email, name) and a dynamic timestamp
 *   rotating every 10 minutes as a backward‑compatible fallback.
 * 
 * Features:
 * - Secure Deno‑signed JWT QR code generation
 * - Fallback to local JSON QR generation if subscription is inactive or service fails
 * - Automatic rotation every 10 minutes to prevent expired scanner states
 * - Adaptive light/dark mode color palettes
 * - PNG download capability with branded overlay
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
  /** Injected SupabaseService to invoke the qr-sign edge function */
  private supabase = inject(SupabaseService).client;
  
  /** Signal for the currently authenticated user session */
  currentUser = this.auth.currentUser;
  /** Computed signal tracking loading state if user data is missing */
  isLoading = computed(() => !this.currentUser());
  /** Internal handle for the 10-minute refresh timer */
  private refreshInterval: any;

  /** Signal containing the signed QR token from the backend, null if using fallback */
  signedQrToken = signal<string | null>(null);

  /**
   * Current QR generation timestamp, updated every 10 minutes.
   * Used as a salt in fallback mode to ensure QR codes are short-lived.
   */
  qrTimestamp = signal<string>(new Date().toISOString());

  /**
   * Generates the raw payload for the QR code.
   * Uses the secure signed JWT token if available, otherwise falls back to a JSON-encoded string.
   * 
   * @returns The QR code content string
   */
  qrData = computed(() => {
    // 1) Usar el token firmado si está disponible
    const token = this.signedQrToken();
    if (token) return token;

    // 2) Fallback: JSON legacy
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
   * Invokes the qr-sign edge function to fetch a secure signed JWT QR code.
   * Silently falls back to legacy JSON generation if no active subscription is found or the service is offline.
   */
  async loadSignedQr() {
    try {
      const { data, error } = await this.supabase.functions.invoke('qr-sign');
      if (error) {
        console.warn('Fallo al obtener QR firmado, usando fallback legacy:', error.message);
        this.signedQrToken.set(null);
      } else if (data && data.token) {
        this.signedQrToken.set(data.token);
      } else {
        this.signedQrToken.set(null);
      }
    } catch (e: any) {
      console.warn('Error llamando a qr-sign, usando fallback legacy:', e);
      this.signedQrToken.set(null);
    }
  }

  /**
   * Initialization logic. Fetches the signed QR and starts the 10-minute rotation interval.
   */
  ngOnInit() {
    this.loadSignedQr();
    
    // Refrescar cada 10 minutos para mantener el QR actualizado y con validez
    this.refreshInterval = setInterval(() => {
      this.loadSignedQr();
      this.qrTimestamp.set(new Date().toISOString());
    }, 10 * 60 * 1000);
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
