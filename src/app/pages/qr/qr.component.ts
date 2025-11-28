import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-qr',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './qr.component.html',
  styleUrl: './qr.component.scss'
})
export class QrComponent implements OnInit {
  auth = inject(AuthService);
  
  currentUser = this.auth.currentUser;
  isLoading = computed(() => !this.currentUser());

  // Datos para el QR (puedes incluir ID, email, nombre, etc.)
  qrData = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    
    // Crear un objeto con los datos del usuario para el QR
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      centerId: user.centerId || null,
      timestamp: new Date().toISOString()
    };
    
    // Convertir a JSON string para el QR
    return JSON.stringify(userData);
  });

  // URL del QR usando la API - Modo claro (azul sobre blanco)
  qrUrl = computed(() => {
    const data = this.qrData();
    if (!data) return '';
    
    // Colores azul/cyan para modo claro (azul oscuro sobre fondo blanco)
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&color=30-64-175&bgcolor=255-255-255&margin=1&ecc=M`;
  });

  // URL del QR para modo oscuro (cyan sobre fondo oscuro)
  qrUrlDark = computed(() => {
    const data = this.qrData();
    if (!data) return '';
    
    const encodedData = encodeURIComponent(data);
    // Colores cyan/blue para modo oscuro (cyan claro sobre fondo gris oscuro)
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&color=34-211-238&bgcolor=30-41-59&margin=1&ecc=M`;
  });

  ngOnInit() {
    // El componente se inicializa automáticamente
  }

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

