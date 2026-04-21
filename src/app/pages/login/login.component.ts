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
 * Componente de página de autenticación para el inicio de sesión del usuario.
 * Maneja la validación de credenciales, alternancia de visibilidad de contraseña y redirección
 * al panel de control o a una URL intentada previamente.
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
    // Inicializa el formulario reactivo con controles de email y contraseña
    this.formLogin = this.formSvc.group({
      'email': ['', [Validators.required, Validators.email]],
      'password': ['', [Validators.required]],
    });
    // Recupera la URL de destino desde el estado de la navegación, o usa el dashboard por defecto
    this.navigateTo = history.state?.['navigateTo'] || '/dashboard';
  }

  /**
   * Alterna la visibilidad del campo de entrada de contraseña.
   */
  togglePassword() {
    // Invierte el estado del signal para mostrar/ocultar los caracteres de la contraseña
    this.showPassword.update(value => !value);
  }

  /**
   * Procesa el envío del formulario de inicio de sesión.
   * Valida las credenciales contra el backend y redirige en caso de éxito.
   */
  onSubmit() {
    // Si el formulario no es válido, marca todos los campos como tocados para disparar los errores visuales
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }

    // Limpia cualquier error anterior antes de iniciar la autenticación
    this.errorMsg.set('');

    // Prepara el objeto de credenciales con los valores actuales del formulario
    const credentials: AuthInput = {
      email: this.formLogin.value.email!,
      password: this.formLogin.value.password!
    };

    // Subscríbete a la llamada del backend para iniciar sesión
    this.authSubscription = this.auth.login(credentials)
      .subscribe({
        next: () => {
          // Si el login es exitoso, redirige al usuario a la URL de destino guardada
          this.router.navigate([this.navigateTo]);
        },
        error: (err: Error) => {
          // Si hay algún error, actualizar el signal de errorMsg con el cuerpo del mensaje
          this.errorMsg.set(err.message);
        }
      });
  }

  /**
   * Navega a la página de registro de usuario.
   */
  goRegister() {
    // Navega manualmente hacia la vista de registro (sign up)
    this.router.navigate(['/register']);
  }

  /**
   * Lógica de limpieza. Se da de baja de los observables de autenticación para prevenir fugas de memoria.
   */
  ngOnDestroy() {
    // Limpia la subscripción de RxJS si existe, evitando fugas de memoria cuando el componente se destruye
    this.authSubscription?.unsubscribe();
  }

  /**
   * Resuelve el mensaje de error de validación traducido para un control de formulario específico.
   * @param control - El nombre del control de formulario o 'global' para errores generales
   * @returns Cadena de error traducida o cadena vacía si no hay errores
   */
  getError(control: string): string {
    // Lógica para interceptar errores globales a nivel del formulario (ej. fallo del servidor)
    if (control === 'global') {
      const msg = this.errorMsg();
      // Transforma el mensaje del servidor en un texto traducido localmente si es de credenciales
      if (msg && msg.includes('Credenciales inválidas')) {
        return this.translate.instant('login.errors.invalidCredentials');
      }
      return msg;
    }

    // Recupera la instancia base del control especificado (email o password)
    const formControl = this.formLogin.get(control);
    // Si el control no existe, no ha sido tocado o carece de errores, no retornar nada
    if (!formControl || !formControl.touched || !formControl.errors) {
      return '';
    }

    // Regla 1: Validar si el campo obligatorio está vacío
    if (formControl.errors['required']) {
      return this.translate.instant(`login.errors.${control}Required`);
    }
    // Regla 2: Validar formato RegExp si el campo es de tipo email
    if (control === 'email' && formControl.errors['email']) {
      return this.translate.instant('login.errors.emailInvalid');
    }

    // Fallback: ningún error renderizable activo
    return "";
  }
}