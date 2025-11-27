import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { RegisterInput } from '../../core/models/auth';

/**
 * Validador personalizado que verifica que las contraseñas del formulario de registro coincidan.
 * Compara los valores de los campos password y confirmPassword.
 * Retorna null si coinciden o un objeto con el error si no coinciden.
 */
export function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  
  if (group.get('confirmPassword')?.pristine) {
    return null;
  }
  
  return password === confirmPassword ? null : { passwordsDoNotMatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnDestroy {
  formRegister: FormGroup;
  builder: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);
  readonly navigateTo: string;

  errorMsg = signal<string>('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  private authSubscription?: Subscription;

  constructor(){
    this.formRegister = this.builder.group({
      'name':['',[Validators.required, Validators.minLength(3)]],
      'email':['', [Validators.required, Validators.email]],
      'password':['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
      'confirmPassword':['', [Validators.required]]
    }, { validators: [passwordsMatchValidator] });
    
    this.navigateTo = history.state?.['navigateTo'] || '/dashboard';
  }

  /**
   * Procesa el envío del formulario de registro validando todos los campos.
   * Crea un nuevo usuario en el sistema con los datos proporcionados.
   * Redirige al dashboard si el registro es exitoso.
   * Muestra mensajes de error si el registro falla o hay problemas de validación.
   */
  onSubmit(){
    if (this.formRegister.invalid) {
      this.formRegister.markAllAsTouched();
      this.errorMsg.set('');
      return;
    }
    
    this.errorMsg.set('');

    const registerData: RegisterInput = {
      name: this.formRegister.value.name!,
      email: this.formRegister.value.email!,
      password: this.formRegister.value.password!
    };

    this.authSubscription = this.auth.register(registerData)
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
   * Limpia las suscripciones activas cuando el componente se destruye.
   * Previene memory leaks cancelando las suscripciones a observables.
   */
  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  /**
   * Alterna la visibilidad del campo de contraseña principal.
   * Cambia entre mostrar el texto de la contraseña o mostrarla oculta.
   */
  togglePassword() {
    this.showPassword.update(value => !value);
  }

  /**
   * Alterna la visibilidad del campo de confirmación de contraseña.
   * Permite al usuario verificar que escribió correctamente la contraseña.
   */
  toggleConfirmPassword() {
    this.showConfirmPassword.update(value => !value);
  }

  /**
   * Navega a la página de login del usuario.
   * Redirige al componente de login para usuarios que ya tienen cuenta.
   */
  goLogin() {
    this.router.navigate(['/login']);
  }
  
  /**
   * Retorna el mensaje de error correspondiente a un control específico del formulario de registro.
   * Maneja errores de validación específicos incluyendo coincidencia de contraseñas.
   * Genera mensajes descriptivos en español para cada tipo de error encontrado.
   */
  getError(control: string): string {
    if (control === 'global') return this.errorMsg();

    const formControl = this.formRegister.get(control);

    if (control === 'confirmPassword' && this.formRegister.errors?.['passwordsDoNotMatch'] && formControl?.touched) {
      return "Las contraseñas no coinciden";
    }

    if (!formControl || !formControl.touched || !formControl.errors) {
      return '';
    }

    if (formControl.errors['required']) {
      const fieldNameMap: { [key: string]: string } = {
        name: 'nombre',
        email: 'email',
        password: 'password',
        confirmPassword: 'confirmar contraseña'
      };
      return `El campo ${fieldNameMap[control] || control} es requerido`;
    }

    if (formControl.errors['minlength']) {
      const requiredLength = formControl.errors['minlength'].requiredLength;
      return `Debe tener al menos ${requiredLength} caracteres`;
    }

    if (formControl.errors['email']) {
      return "El formato de email no es correcto";
    }

    if (formControl.errors['pattern']) {
      return "Al menos una mayúscula, una minúscula, un número y 8 caracteres";
    }

    return "";
  }
}