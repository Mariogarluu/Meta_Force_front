import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { AuthService } from '../../core/services/auth.service';
import { CentersService } from '../../core/services/centers.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Center } from '../../core/models/center';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

/**
 * Interface representing the result of a QR scan.
 * Contains information about the operation type (entry/exit) and the processed user.
 */
interface ScanResult {
  /** Indicates if the backend successfully processed the access */
  success: boolean;
  /** Whether the user was entering or exiting the facility */
  type: 'entry' | 'exit';
  /** Human-readable status message from the server */
  message: string;
  /** Basic user information associated with the scanned QR */
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Component for scanning QR codes and registering user entries/exits at gym centers.
 * 
 * Features:
 * - Device camera access for real-time QR code scanning
 * - Automatic or manual center selection based on user role
 * - Automated entry/exit detection based on user's current occupancy state
 * - Visual feedback with green (entry) or red (exit) flash animations
 * - QR expiration validation (20-minute window)
 *
 * Accessible only to SUPERADMIN and ADMIN_CENTER roles.
 */
@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ThemeToggleComponent, TranslateModule, LanguageSelectorComponent],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.scss'
})
export class QrScannerComponent implements OnInit, OnDestroy {
  /** Injected AuthService for permission and session context */
  auth = inject(AuthService);
  /** Injected CentersService for accessing gym location data */
  centersService = inject(CentersService);
  /** Supabase (Edge access-scan) */
  private supabase = inject(SupabaseService).client;
  /** Injected TranslateService for multi-language UI feedback */
  translate = inject(TranslateService);

  /** Signal for the currently authenticated administrator */
  currentUser = this.auth.currentUser;
  /** Signal containing the list of gym centers the admin can manage */
  centers = signal<Center[]>([]);
  /** Signal storing the ID of the gym center where scanning is active */
  selectedCenterId = signal<string | null>(null);
  /** Signal tracking the active state of the camera/scanner */
  isScanning = signal(false);
  /** Instance of the Html5Qrcode library for camera stream processing */
  scanner: Html5Qrcode | null = null;
  /** Signal storing the metadata of the most recently processed scan */
  lastScanResult = signal<ScanResult | null>(null);
  /** Signal for displaying camera-related or API error messages */
  scanError = signal<string>('');
  /** Signal controlling the visibility of the success/failure flash overlay */
  showFlash = signal(false);
  /** Signal determining the color/type of the visual feedback flash */
  flashType = signal<'entry' | 'exit' | null>(null);

  /**
   * Determines if the admin must manually pick a gym center from the UI.
   * Super Admins always choose if centers exist.
   * Center Admins choose only if they have access to multiple facilities.
   * 
   * @returns true if center selection UI should be shown
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

  /**
   * Initializes the component by fetching available gym centers.
   */
  ngOnInit() {
    this.loadCenters();
  }

  /**
   * Lifecycle hook to ensure the camera scanner is stopped when the component is destroyed.
   */
  ngOnDestroy() {
    this.stopScanning();
  }

  /**
   * Loads accessible gym centers based on the authenticated user's role.
   * Superior admins see all facilities; local admins see only assigned ones.
   * 
   * If only one center is found, it is automatically selected to speed up the process.
   */
  async loadCenters() {
    try {
      const centers = await this.centersService.listCenters().toPromise();
      if (centers) {
        this.centers.set(centers);
        
        // Auto-select if there is exactly one center
        if (centers.length === 1 && centers[0].id) {
          this.selectedCenterId.set(centers[0].id);
          this.startScanning();
        } else if (centers.length > 1 && this.needsCenterSelection()) {
          // Wait for manual user selection
        } else {
          // Case for ADMIN_CENTER with a single assigned facility
          const user = this.currentUser();
          if (user?.centerId) {
            this.selectedCenterId.set(user.centerId);
            this.startScanning();
          }
        }
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      this.scanError.set(this.translate.instant('qrScanner.errors.loadCenters'));
    }
  }

  /**
   * Event trigger when the administrator manually selects a facility from the dropdown.
   * Automatically initializes the QR scanner for the chosen center.
   */
  async onCenterSelected() {
    if (this.selectedCenterId()) {
      await this.startScanning();
    }
  }

  /**
   * Initializes the QR scanner using the device's environment-facing (rear) camera.
   * Configures a 10 FPS refresh rate and a 250x250px scan area.
   * 
   * Requires explicit browser camera permissions.
   * @throws Error if camera access is denied or hardware is unavailable.
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
          // Silent failure for periodic scans that don't find a code
        }
      );
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      this.scanError.set(this.translate.instant('qrScanner.errors.cameraAccess'));
      this.isScanning.set(false);
    }
  }

  /**
   * Stops the active QR scanner and releases the camera hardware.
   * Resets the scan state and cleans up library instances.
   */
  async stopScanning() {
    if (this.scanner) {
      try {
        await this.scanner.stop();
        await this.scanner.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
      this.scanner = null;
    }
    this.isScanning.set(false);
  }

  /**
   * Processes the decoded text from a QR code.
   * Performs validation on the JSON format, timestamp expiration (20 mins), and registers access.
   * 
   * Workflow:
   * 1. Pause scanner
   * 2. Validate JSON structure (id, timestamp)
   * 3. Check for expiration
   * 4. Invocar Edge Function access-scan (supabase.functions.invoke)
   * 5. Trigger visual feedback effect
   * 6. Resume scanner after 2 seconds
   * 
   * @param qrText - Raw string from the scanned QR code (expected JSON format)
   */
  /**
   * Decodes JWT token payload without signature verification in frontend.
   */
  private decodeJwt(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  async handleQRScan(qrText: string) {
    try {
      // Pause scanner while processing
      if (this.scanner) {
        await this.scanner.pause();
      }

      let qrData: any = null;
      let trimmedText = qrText.trim();

      if (trimmedText.includes('.')) {
        // Es un token JWT firmado
        const decoded = this.decodeJwt(trimmedText);
        if (decoded) {
          qrData = {
            id: decoded.user_id,
            timestamp: new Date(decoded.exp * 1000).toISOString(),
            email: decoded.email || '',
            name: decoded.name || 'Personal'
          };
        }
      }

      if (!qrData) {
        // Fallback a JSON legacy
        qrData = JSON.parse(trimmedText);
      }
      
      if (!qrData || !qrData.id || !qrData.timestamp) {
        this.scanError.set(this.translate.instant('qrScanner.errors.invalidQR'));
        this.resumeScanning();
        return;
      }

      // Validate 20-minute expiration window
      const qrTime = new Date(qrData.timestamp).getTime();
      const now = Date.now();
      const twentyMinutes = 20 * 60 * 1000;

      if (now - qrTime > twentyMinutes) {
        this.scanError.set(this.translate.instant('qrScanner.errors.expiredQR'));
        this.resumeScanning();
        return;
      }

      const centerId = this.selectedCenterId();
      if (!centerId) {
        this.scanError.set(this.translate.instant('qrScanner.errors.processingError'));
        this.resumeScanning();
        return;
      }

      const { data: result, error } = await this.supabase.functions.invoke<ScanResult>('access-scan', {
        body: {
          qrData: {
            id: qrData.id,
            email: qrData.email,
            name: qrData.name,
            timestamp: qrData.timestamp,
          },
          centerId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (result) {
        this.lastScanResult.set(result);
        this.scanError.set('');
        
        // Apply visual feedback based on entry/exit
        this.showFlashEffect(result.type);
        
        // Auto-resume after cooldown
        setTimeout(() => {
          this.resumeScanning();
          this.showFlash.set(false);
          this.flashType.set(null);
        }, 2000);
      }
    } catch (error: any) {
      console.error('QR Processing Error:', error);
      this.scanError.set(error.error?.message || this.translate.instant('qrScanner.errors.processingError'));
      this.resumeScanning();
    }
  }

  /**
   * Triggers a screen-flash visual effect to signal status to the administrator.
   * Green flash for check-in ('entry'), red flash for check-out ('exit').
   * @param type - The type of access recorded
   */
  showFlashEffect(type: 'entry' | 'exit') {
    this.flashType.set(type);
    this.showFlash.set(true);
    
    // Auto-hide overlay after 2 seconds
    setTimeout(() => {
      this.showFlash.set(false);
      this.flashType.set(null);
    }, 2000);
  }

  /**
   * Resumes the camera scan loop after a successful registration or error.
   * Fully restarts the scanner instance if resumption fails.
   */
  async resumeScanning() {
    if (this.scanner && this.isScanning()) {
      try {
        await this.scanner.resume();
      } catch (error) {
        console.error('Error resuming camera:', error);
        // Fallback: full restart on hardware failure
        await this.stopScanning();
        await this.startScanning();
      }
    }
  }
}

