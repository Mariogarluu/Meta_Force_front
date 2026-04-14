import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { RegisterInput } from '../../core/models/auth';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

/**
 * Custom validator that verifies that passwords in the registration form match.
 * Compares the values of the password and confirmPassword fields.
 * @param group - The abstract control representing the form group
 * @returns null if they match, or a validation error object if they don't
 */
export function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  
  if (confirmPassword === undefined || group.get('confirmPassword')?.pristine) {
    return null;
  }
  
  return password === confirmPassword ? null : { passwordsDoNotMatch: true };
}

/**
 * User registration page component.
 * Facilitates the creation of new user accounts, including role selection
 * (if permitted by the user's permissions or system configuration).
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeToggleComponent, TranslateModule, LanguageSelectorComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnDestroy {
  /** Reactive form group for user registration data */
  formRegister: FormGroup;
  /** Injected FormBuilder for constructing the registration form */
  builder: FormBuilder = inject(FormBuilder);
  /** Injected AuthService for account creation API calls */
  auth: AuthService = inject(AuthService);
  /** Injected Router for post-registration navigation */
  router: Router = inject(Router);
  /** Injected TranslateService for multi-language validation messages */
  translate = inject(TranslateService);
  /** Target URL to navigate to after successful registration */
  readonly navigateTo: string;

  /** Signal for displaying registration-related error messages */
  errorMsg = signal<string>('');
  /** Signal controlling the visibility of the password field */
  showPassword = signal(false);
  /** Signal controlling the visibility of the confirm password field */
  showConfirmPassword = signal(false);
  /** Handle for the active authentication subscription to prevent leaks */
  private authSubscription?: Subscription;

  /**
   * Initializes the registration form with validation rules.
   * Sets up the password match validator and checks for navigation state.
   */
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
   * Processes the registration form submission.
   * Validates all fields, creates the user account, and redirects to the dashboard.
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
   * Cleanup logic. Unsubscribes from auth observables to prevent memory leaks.
   */
  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  /**
   * Toggles the visibility of the main password input field.
   */
  togglePassword() {
    this.showPassword.update(value => !value);
  }

  /**
   * Toggles the visibility of the confirm password input field.
   */
  toggleConfirmPassword() {
    this.showConfirmPassword.update(value => !value);
  }

  /**
   * Navigates to the user login page.
   */
  goLogin() {
    this.router.navigate(['/login']);
  }
  
  /**
   * Resolves the translated validation error message for a specific form control.
   * @param control - The name of the form control or 'global' for general errors
   * @returns Translated error string or empty string if no errors
   */
  getError(control: string): string {
    if (control === 'global') return this.errorMsg();

    const formControl = this.formRegister.get(control);

    if (control === 'confirmPassword' && this.formRegister.errors?.['passwordsDoNotMatch'] && formControl?.touched) {
      return this.translate.instant('register.errors.passwordsDoNotMatch');
    }

    if (!formControl || !formControl.touched || !formControl.errors) {
      return '';
    }

    if (formControl.errors['required']) {
      return this.translate.instant(`register.errors.${control}Required`);
    }

    if (formControl.errors['minlength']) {
      const requiredLength = formControl.errors['minlength'].requiredLength;
      return this.translate.instant('register.errors.passwordMinLength', { min: requiredLength });
    }

    if (formControl.errors['email']) {
      return this.translate.instant('register.errors.emailInvalid');
    }

    if (formControl.errors['pattern']) {
      return this.translate.instant('register.errors.passwordPattern');
    }

    return "";
  }
}