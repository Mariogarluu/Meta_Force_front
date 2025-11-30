import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { AuthInput } from '../../core/models/auth';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ThemeToggleComponent, TranslateModule, LanguageSelectorComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  formLogin;
  errorMsg = signal<string>('');
  private router:Router = inject(Router);
  readonly navigateTo:string;
  translate = inject(TranslateService);
  
  showPassword = signal(false); 
  private authSubscription?: Subscription;

  constructor(
    private formSvc:FormBuilder,
    private auth:AuthService
  ){
    this.formLogin = this.formSvc.group({
      'email':['', [Validators.required, Validators.email]],
      'password':['', [Validators.required]],
    });

    this.navigateTo = history.state?.['navigateTo'] || '/dashboard';
  }

  /**
   * Alterna la visibilidad de la contraseña en el campo de entrada.
   * Cambia entre mostrar el texto de la contraseña o mostrarla oculta con asteriscos.
   */
  togglePassword() {
    this.showPassword.update(value => !value);
  }

  /**
   * Procesa el envío del formulario de login validando las credenciales.
   * Valida el formulario y realiza una petición de autenticación al backend.
   * Redirige al dashboard o a la URL guardada si el login es exitoso.
   * Muestra mensajes de error si la autenticación falla.
   */
  onSubmit(){
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
   * Navega a la página de registro del usuario.
   * Redirige al componente de registro para que el usuario pueda crear una nueva cuenta.
   */
  goRegister() {
    this.router.navigate(['/register']);
  }

  /**
   * Limpia las suscripciones activas cuando el componente se destruye.
   * Previene memory leaks cancelando las suscripciones a observables.
   */
  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  /**
   * Retorna el mensaje de error correspondiente a un control específico del formulario.
   * Genera mensajes personalizados según el tipo de error de validación encontrado.
   * Retorna cadena vacía si no hay errores o si el control no ha sido tocado.
   */
  getError(control:string): string {
    if (control === 'global') return this.errorMsg();

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