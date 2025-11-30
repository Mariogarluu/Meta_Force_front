import { Component, inject, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente para generar y mostrar el código QR personal del usuario.
 * 
 * El QR contiene información del usuario (id, email, name) y un timestamp que se actualiza
 * automáticamente cada 20 minutos para mantener el código válido. El QR NO incluye centerId
 * porque un usuario puede acceder a múltiples centros.
 * 
 * Características:
 * - Actualización automática cada 20 minutos
 * - Colores adaptativos según el tema (claro/oscuro)
 * - Funcionalidad de descarga del QR como imagen PNG
 * - Validación de expiración en el backend (20 minutos máximo)
 */
@Component({
  selector: 'app-qr',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent, LanguageSelectorComponent, TranslateModule],
  templateUrl: './qr.component.html',
  styleUrl: './qr.component.scss'
})
export class QrComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  
  currentUser = this.auth.currentUser;
  isLoading = computed(() => !this.currentUser());
  private refreshInterval: any;

  /**
   * Timestamp actual del QR que se actualiza automáticamente cada 20 minutos.
   * Se usa para generar un nuevo QR y mantenerlo válido según las políticas de expiración.
   */
  qrTimestamp = signal<string>(new Date().toISOString());

  /**
   * Genera los datos del QR en formato JSON string.
   * 
   * El QR contiene:
   * - id: ID único del usuario
   * - email: Email del usuario
   * - name: Nombre del usuario
   * - timestamp: Fecha y hora de generación (ISO string)
   * 
   * NO incluye centerId porque el usuario puede acceder a múltiples centros.
   * El timestamp se actualiza cada 20 minutos para mantener el QR válido.
   * 
   * @returns JSON string con los datos del usuario para el QR
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
   * Genera la URL del código QR para modo claro usando la API de QR Server.
   * Usa colores azul oscuro sobre fondo blanco para mejor legibilidad en modo claro.
   * 
   * @returns URL de la imagen del QR para modo claro
   */
  qrUrl = computed(() => {
    const data = this.qrData();
    if (!data) return '';
    
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&color=30-64-175&bgcolor=255-255-255&margin=1&ecc=M`;
  });

  /**
   * Genera la URL del código QR para modo oscuro usando la API de QR Server.
   * Usa colores cyan claro sobre fondo gris oscuro para mejor legibilidad en modo oscuro.
   * 
   * @returns URL de la imagen del QR para modo oscuro
   */
  qrUrlDark = computed(() => {
    const data = this.qrData();
    if (!data) return '';
    
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&color=34-211-238&bgcolor=30-41-59&margin=1&ecc=M`;
  });

  /**
   * Inicializa el componente y configura la actualización automática del QR cada 20 minutos.
   * Esto asegura que el código QR siempre esté dentro del período de validez (20 minutos).
   */
  ngOnInit() {
    this.refreshInterval = setInterval(() => {
      this.qrTimestamp.set(new Date().toISOString());
    }, 20 * 60 * 1000); // 20 minutos
  }

  /**
   * Limpia el intervalo de actualización cuando el componente se destruye.
   * Previene memory leaks al eliminar el timer activo.
   */
  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Genera y descarga el código QR como una imagen PNG.
   * 
   * Crea un canvas con el QR, el nombre del usuario y el logo de Meta Force Gym.
   * El fondo y los colores se adaptan según el tema actual (claro/oscuro).
   * 
   * El archivo se descarga con el nombre: `qr-{nombreUsuario}-{timestamp}.png`
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

