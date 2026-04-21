import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { AuthInput } from '../../core/models/auth';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

/**
 * =============================================================================
 * COMPONENTE DE INICIO DE SESIÓN (LOGIN)
 * =============================================================================
 * Componente principal para la autenticación de usuarios en la plataforma.
 * 
 * Responsabilidades:
 * 1. Presentar un formulario reactivo para la captura de credenciales seguras.
 * 2. Gestionar la validación sintáctica (formato email, requerido) a nivel cliente.
 * 3. Comunicar los intentos de inicio de sesión al AuthService.
 * 4. Gestionar la experiencia de usuario (UI), incluyendo visibilidad dinámica de contraseña
 *    y manejo de direccionamiento pre-autenticación (deeplinking).
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ThemeToggleComponent, TranslateModule, LanguageSelectorComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  /** Grupo de formulario reactivo para las credenciales de inicio de sesión del usuario, gestionado mediante FormBuilder */
  formLogin: any;
  /** Señal (Signal) para mostrar mensajes de error relacionados con la autenticación */
  errorMsg = signal<string>('');
  /** Servicio Router inyectado para la navegación posterior al inicio de sesión */
  private router: Router = inject(Router);
  /** URL de destino a la que navegar después de una autenticación exitosa */
  readonly navigateTo: string;
  /** TranslateService inyectado para mensajes de validación multilingües */
  translate = inject(TranslateService);

  /** Señal que controla la visibilidad del campo de entrada de contraseña */
  showPassword = signal(false);
  /** Referencia a la suscripción de autenticación activa para evitar fugas de memoria */
  private authSubscription?: Subscription;

  /**
   * Inicializa el formulario de inicio de sesión con campos de correo y contraseña.
   * Verifica si hay una URL de navegación de destino en el estado del historial.
   * @param formSvc - FormBuilder inyectado para construir el formulario reactivo
   * @param auth - AuthService inyectado para la verificación de credenciales
   */
  constructor(
    private formSvc: FormBuilder,
    private auth: AuthService
  ) {
    this.formLogin = this.formSvc.group({
      'email': ['', [Validators.required, Validators.email]],
      'password': ['', [Validators.required]],
    });
    this.navigateTo = history.state?.['navigateTo'] || '/dashboard';
  }

  /**
   * Alterna la visibilidad del campo de entrada de contraseña.
   */
  togglePassword() {
    this.showPassword.update(value => !value);
  }

  /**
   * Procesa el envío del formulario de inicio de sesión.
   * Valida las credenciales contra el backend y redirige en caso de éxito.
   */
  onSubmit() {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }

    this.errorMsg.set('');

    const credentials: AuthInput = {
      email: this.formLogin.value.email!,
      password: this.formLogin.value.password!
    };

    this.authSubscription = this.auth.login(credentials)
      .subscribe({
        next: () => {
          this.router.navigate([this.navigateTo]);
        },
        error: (err: Error) => {
          this.errorMsg.set(err.message);
        }
      });
  }

  /**
   * Navega a la página de registro de usuario.
   */
  goRegister() {
    this.router.navigate(['/register']);
  }

  /**
   * Lógica de limpieza. Se da de baja de los observables de autenticación para prevenir fugas de memoria.
   */
  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  /**
   * Resuelve el mensaje de error de validación traducido para un control de formulario específico.
   * @param control - El nombre del control de formulario o 'global' para errores generales
   * @returns Cadena de error traducida o cadena vacía si no hay errores
   */
  getError(control: string): string {
    if (control === 'global') {
      const msg = this.errorMsg();
      if (msg && msg.includes('Credenciales inválidas')) {
        return this.translate.instant('login.errors.invalidCredentials');
      }
      return msg;
    }

    const formControl = this.formLogin.get(control);
    if (!formControl || !formControl.touched || !formControl.errors) {
      return '';
    }

    if (formControl.errors['required']) {
      return this.translate.instant(`login.errors.${control}Required`);
    }
    
    if (control === 'email' && formControl.errors['email']) {
      return this.translate.instant('login.errors.emailInvalid');
    }

    return "";
  }
}