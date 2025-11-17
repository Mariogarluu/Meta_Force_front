import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { AuthInput } from '../../core/models/auth'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {

  formLogin;
  errorMsg = signal<string>('');
  private router:Router = inject(Router);
  readonly navigateTo:string;
  
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

  togglePassword() {
    this.showPassword.update(value => !value);
  }

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
  
  goRegister() {
    this.router.navigate(['/register']);
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  getError(control:string): string {
    if (control === 'global') return this.errorMsg();

    const formControl = this.formLogin.get(control);
    if (!formControl || !formControl.touched || !formControl.errors) {
      return '';
    }

    if (formControl.errors['required']) {
      return `El campo ${control === 'email' ? 'email' : 'contraseña'} es requerido`;
    }
    if (control === 'email' && formControl.errors['email']) {
      return "El formato de email no es correcto";
    }

    return "";
  }
}