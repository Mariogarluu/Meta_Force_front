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
 * Authentication page component for user login.
 * Handles credential validation, password visibility toggling, and redirection
 * to the dashboard or a previously attempted URL.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ThemeToggleComponent, TranslateModule, LanguageSelectorComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  /** Reactive form group for user login credentials, managed via FormBuilder */
  formLogin: any;
  /** Signal for displaying authentication-related error messages */
  errorMsg = signal<string>('');
  /** Injected Router for post-login navigation */
  private router: Router = inject(Router);
  /** Target URL to navigate to after successful authentication */
  readonly navigateTo: string;
  /** Injected TranslateService for multi-language validation messages */
  translate = inject(TranslateService);

  /** Signal controlling the visibility of the password field */
  showPassword = signal(false);
  /** Handle for the active authentication subscription to prevent leaks */
  private authSubscription?: Subscription;

  /**
   * Initializes the login form with email and password fields.
   * Checks for a target navigation URL in the history state.
   * @param formSvc - Injected FormBuilder to construct the reactive form
   * @param auth - Injected AuthService for credential verification
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
   * Toggles the visibility of the password input field.
   */
  togglePassword() {
    this.showPassword.update(value => !value);
  }

  /**
   * Processes the login form submission.
   * Validates credentials against the backend and redirects on success.
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
   * Navigates to the user registration page.
   */
  goRegister() {
    this.router.navigate(['/register']);
  }

  /**
   * Cleanup logic. Unsubscribes from auth observables to prevent memory leaks.
   */
  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  /**
   * Resolves the translated validation error message for a specific form control.
   * @param control - The name of the form control or 'global' for general errors
   * @returns Translated error string or empty string if no errors
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