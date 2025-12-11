import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { AuthService } from '../../core/services/auth.service';
import { CentersService } from '../../core/services/centers.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Center } from '../../core/models/center';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

/**
 * Interfaz para el resultado de un escaneo de QR.
 * Contiene información sobre el tipo de operación (entrada/salida) y el usuario procesado.
 */
interface ScanResult {
  success: boolean;
  type: 'entry' | 'exit';
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Componente para escanear códigos QR y registrar entradas/salidas de usuarios en centros.
 * 
 * Funcionalidades:
 * - Acceso a la cámara del dispositivo para escanear QR codes
 * - Selección automática o manual del centro según el rol del usuario
 * - Detección automática de entrada/salida basada en el estado del usuario
 * - Feedback visual con flash verde (entrada) o rojo (salida)
 * - Validación de expiración del QR (20 minutos)
 * 
 * Solo accesible para SUPERADMIN y ADMIN_CENTER.
 */
@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ThemeToggleComponent, TranslateModule, LanguageSelectorComponent],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.scss'
})
export class QrScannerComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  centersService = inject(CentersService);
  http = inject(HttpClient);
  translate = inject(TranslateService);

  currentUser = this.auth.currentUser;
  centers = signal<Center[]>([]);
  selectedCenterId = signal<string | null>(null);
  isScanning = signal(false);
  scanner: Html5Qrcode | null = null;
  lastScanResult = signal<ScanResult | null>(null);
  scanError = signal<string>('');
  showFlash = signal(false);
  flashType = signal<'entry' | 'exit' | null>(null);

  /**
   * Determina si el usuario necesita seleccionar un centro antes de escanear.
   * SUPERADMIN siempre necesita seleccionar si hay centros disponibles.
   * ADMIN_CENTER solo necesita seleccionar si tiene acceso a más de un centro.
   * 
   * @returns true si se requiere selección de centro, false si se puede iniciar automáticamente
   */
  needsCenterSelection = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    
    if (user.role === 'SUPERADMIN') {
      return this.centers().length > 0;
    }
    
    if (user.role === 'ADMIN_CENTER') {
      return this.centers().length > 1;
    }
    
    return false;
  });

  ngOnInit() {
    this.loadCenters();
  }

  ngOnDestroy() {
    this.stopScanning();
  }

  /**
   * Carga los centros disponibles según el rol del usuario autenticado.
   * SUPERADMIN ve todos los centros del sistema.
   * ADMIN_CENTER solo ve su propio centro (o centros si tiene acceso a múltiples).
   * 
   * Si solo hay un centro disponible, lo selecciona automáticamente e inicia el escáner.
   * Si hay múltiples centros, muestra un selector para que el usuario elija.
   */
  async loadCenters() {
    try {
      const centers = await this.centersService.listCenters().toPromise();
      if (centers) {
        this.centers.set(centers);
        
        // Si solo hay un centro, seleccionarlo automáticamente
        if (centers.length === 1 && centers[0].id) {
          this.selectedCenterId.set(centers[0].id);
          this.startScanning();
        } else if (centers.length > 1 && this.needsCenterSelection()) {
          // Esperar a que el usuario seleccione
        } else {
          // Si es ADMIN_CENTER con un solo centro asignado
          const user = this.currentUser();
          if (user?.centerId) {
            this.selectedCenterId.set(user.centerId);
            this.startScanning();
          }
        }
      }
    } catch (error) {
      console.error('Error cargando centros:', error);
      this.scanError.set(this.translate.instant('qrScanner.errors.loadCenters'));
    }
  }

  /**
   * Callback que se ejecuta cuando el usuario selecciona un centro del dropdown.
   * Inicia automáticamente el escáner de QR si se ha seleccionado un centro válido.
   */
  async onCenterSelected() {
    if (this.selectedCenterId()) {
      await this.startScanning();
    }
  }

  /**
   * Inicia el escáner de QR usando la cámara trasera del dispositivo.
   * Configura Html5Qrcode con una frecuencia de 10 FPS y un área de escaneo de 250x250px.
   * Requiere permisos de cámara del navegador.
   * 
   * @throws Error si no se puede acceder a la cámara o si no hay un centro seleccionado
   */
  async startScanning() {
    if (!this.selectedCenterId()) {
      this.scanError.set(this.translate.instant('qrScanner.errors.selectCenter'));
      return;
    }

    try {
      this.scanner = new Html5Qrcode('qr-reader');
      this.isScanning.set(true);
      this.scanError.set('');

      await this.scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          this.handleQRScan(decodedText);
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo
        }
      );
    } catch (error: any) {
      console.error('Error iniciando escáner:', error);
      this.scanError.set(this.translate.instant('qrScanner.errors.cameraAccess'));
      this.isScanning.set(false);
    }
  }

  /**
   * Detiene el escáner de QR y libera los recursos de la cámara.
   * Limpia la instancia de Html5Qrcode y restablece el estado de escaneo.
   * Debe llamarse cuando el componente se destruye o cuando el usuario detiene manualmente el escáner.
   */
  async stopScanning() {
    if (this.scanner) {
      try {
        await this.scanner.stop();
        await this.scanner.clear();
      } catch (error) {
        console.error('Error deteniendo escáner:', error);
      }
      this.scanner = null;
    }
    this.isScanning.set(false);
  }

  /**
   * Procesa un código QR escaneado, valida su formato y expiración, y envía los datos al backend.
   * 
   * El proceso incluye:
   * 1. Parsear el JSON del QR
   * 2. Validar que contenga id y timestamp
   * 3. Verificar que no haya expirado (máximo 20 minutos)
   * 4. Enviar al endpoint /api/access/scan
   * 5. Mostrar feedback visual según el resultado
   * 6. Reanudar el escaneo después de 2 segundos
   * 
   * @param qrText - Texto del QR parseado (debe ser un JSON válido)
   */
  async handleQRScan(qrText: string) {
    try {
      // Pausar el escáner temporalmente
      if (this.scanner) {
        await this.scanner.pause();
      }

      // Parsear el QR
      const qrData = JSON.parse(qrText);
      
      if (!qrData.id || !qrData.timestamp) {
        this.scanError.set(this.translate.instant('qrScanner.errors.invalidQR'));
        this.resumeScanning();
        return;
      }

      // Validar expiración del QR (20 minutos)
      const qrTime = new Date(qrData.timestamp).getTime();
      const now = Date.now();
      const twentyMinutes = 20 * 60 * 1000;

      if (now - qrTime > twentyMinutes) {
        this.scanError.set(this.translate.instant('qrScanner.errors.expiredQR'));
        this.resumeScanning();
        return;
      }

      // Enviar al backend
      const result = await this.http.post<ScanResult>(
        `${environment.apiUrl}/access/scan`,
        {
          qrData: {
            id: qrData.id,
            email: qrData.email,
            name: qrData.name,
            timestamp: qrData.timestamp
          },
          centerId: this.selectedCenterId()
        }
      ).toPromise();

      if (result) {
        this.lastScanResult.set(result);
        this.scanError.set('');
        
        // Mostrar flash según el tipo
        this.showFlashEffect(result.type);
        
        // Reanudar escaneo después de 2 segundos
        setTimeout(() => {
          this.resumeScanning();
          this.showFlash.set(false);
          this.flashType.set(null);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error procesando QR:', error);
      this.scanError.set(error.error?.message || this.translate.instant('qrScanner.errors.processingError'));
      this.resumeScanning();
    }
  }

  /**
   * Muestra un efecto visual de flash alrededor del área de la cámara.
   * Verde para entrada (entry) y rojo para salida (exit).
   * El efecto se oculta automáticamente después de 2 segundos.
   * 
   * @param type - Tipo de operación: 'entry' para entrada (verde) o 'exit' para salida (rojo)
   */
  showFlashEffect(type: 'entry' | 'exit') {
    this.flashType.set(type);
    this.showFlash.set(true);
    
    // El flash se oculta automáticamente después de 2 segundos
    setTimeout(() => {
      this.showFlash.set(false);
      this.flashType.set(null);
    }, 2000);
  }

  /**
   * Reanuda el escaneo de QR después de procesar un código exitosamente.
   * Si falla al reanudar, reinicia completamente el escáner.
   * Se llama automáticamente después de procesar un QR para continuar escaneando.
   */
  async resumeScanning() {
    if (this.scanner && this.isScanning()) {
      try {
        await this.scanner.resume();
      } catch (error) {
        console.error('Error reanudando escáner:', error);
        // Si falla, reiniciar
        await this.stopScanning();
        await this.startScanning();
      }
    }
  }
}

