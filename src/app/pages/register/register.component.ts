import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { RegisterInput } from '../../core/models/auth';

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
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
      'surname':['',[Validators.required, Validators.minLength(3)]],
      'email':['', [Validators.required, Validators.email]],
      'password':['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
      'confirmPassword':['', [Validators.required]]
    }, { validators: [passwordsMatchValidator] });
    
    this.navigateTo = history.state?.['navigateTo'] || '/dashboard';
  }

  onSubmit(){
    if (this.formRegister.invalid) {
      this.formRegister.markAllAsTouched();
      this.errorMsg.set('');
      return;
    }
    
    this.errorMsg.set('');

    const registerData: RegisterInput = {
      name: this.formRegister.value.name!,
      surname: this.formRegister.value.surname!,
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

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  togglePassword() {
    this.showPassword.update(value => !value);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update(value => !value);
  }

  goLogin() {
    this.router.navigate(['/login']);
  }
  
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
        surname: 'apellidos',
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