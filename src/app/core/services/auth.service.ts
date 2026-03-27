import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../models/user';
import { AuthInput, RegisterInput, AuthResponse } from '../models/auth';
import { environment } from '../../../environments/environment';

/**
 * Service handling authentication, session management, and user profile data.
 * Manages the current user state via Angular signals and handles both cookie-based and token-based (legacy) authentication.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Injected HttpClient for authentication API calls */
  private http = inject(HttpClient);
  /** Base API URL for authentication operations */
  private apiUrl = `${environment.apiUrl}/auth`;
  /** Internal signal for the currently authenticated user */
  private _currentUser = signal<User | null>(null);

  /** Public read-only signal for the current user */
  public readonly currentUser = this._currentUser.asReadonly();

  /** ReplaySubject emitting true once the initial user profile load attempt finishes */
  private _initialLoadComplete = new ReplaySubject<boolean>(1);
  /** Observable tracking if the initial authentication check is complete */
  public readonly initialLoadComplete = this._initialLoadComplete.asObservable();


  /**
   * Initializes the service and attempts to load the user profile if a session exists.
   */
  constructor() {
    // Siempre intentar cargar perfil: puede haber sesión por cookie (HttpOnly)
    // o token legacy en localStorage. Si falla (401), loadUserProfile maneja el error.
    this.loadUserProfile();
  }

  /**
   * Retrieves the legacy JWT token from LocalStorage.
   * @returns The stored auth token or null
   */
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Establishes a user session by storing the JWT and updating the current user signal.
   * @param authResult - Authentication response containing user and token
   */
  private setSession(authResult: AuthResponse) {
    localStorage.setItem('auth_token', authResult.token);
    this._currentUser.set(authResult.user);
  }

  /**
   * Attempts to load the authenticated user's profile from the API.
   * Cleans up the session if the profile fails to load (e.g., expired session).
   */
  private loadUserProfile() {
    this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      tap(user => {
        this._currentUser.set(user);
        this._initialLoadComplete.next(true); // Éxito: Carga inicial terminada
      }),
      catchError(() => {
        this.logout();
        this._initialLoadComplete.next(true); // Fallo: Carga inicial terminada (sesión inválida)
        return throwError(() => new Error('Sesión inválida'));
      })
    ).subscribe();
  }

  /**
   * Authenticates a user with email and password credentials.
   * @param credentials - User's login email and password
   * @returns Observable emitting the authentication response
   */
  login(credentials: AuthInput): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Registers a new user in the system.
   * Automatically establishes a session if the new user's status is ACTIVE.
   * @param data - User registration information
   * @returns Observable emitting the authentication response
   */
  register(data: RegisterInput): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        // Solo iniciamos sesión automáticamente si la cuenta está activa
        if (response.user.status === 'ACTIVE') {
          this.setSession(response);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Logs out the user by calling the API logout endpoint and clearing local state.
   */
  logout() {
    // Llamar al endpoint de logout para borrar la cookie
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        localStorage.removeItem('auth_token');
        this._currentUser.set(null);
      },
      error: () => {
        localStorage.removeItem('auth_token');
        this._currentUser.set(null);
      }
    });
  }

  /**
   * Reloads the authenticated user's profile from the API.
   */
  refreshUser() {
    this.loadUserProfile();
  }

  /**
   * Generic error handler for authentication HTTP requests.
   * @param error - The HTTP error response
   * @returns Observable throwing an Error with a user-friendly message
   */
  private handleError(error: HttpErrorResponse) {
    const errorMessage = error.error?.message || 'Error desconocido';
    return throwError(() => new Error(errorMessage));
  }
}