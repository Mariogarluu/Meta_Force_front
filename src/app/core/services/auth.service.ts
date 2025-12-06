import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../models/user';
import { AuthInput, RegisterInput, AuthResponse } from '../models/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private _currentUser = signal<User | null>(null);
  
  public readonly currentUser = this._currentUser.asReadonly();

  constructor() {
    const token = this.getToken();
    if (token) {
      this.loadUserProfile();
    }
  }

  /**
   * Obtiene el token JWT almacenado en el localStorage del navegador.
   * Retorna null si no existe ningún token almacenado.
   */
  private getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  /**
   * Establece la sesión del usuario guardando el token JWT y actualizando el signal del usuario actual.
   * Almacena el token en localStorage para persistencia entre recargas de página.
   */
  private setSession(authResult: AuthResponse) {
    localStorage.setItem('jwt_token', authResult.token);
    this._currentUser.set(authResult.user);
  }
  
  /**
   * Carga el perfil del usuario autenticado desde la API utilizando el token almacenado.
   * Actualiza el signal del usuario actual con la información obtenida.
   * Si falla la carga, cierra la sesión automáticamente por seguridad.
   */
  private loadUserProfile() {
    this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      tap(user => this._currentUser.set(user)),
      catchError(() => {
        this.logout();
        return throwError(() => new Error('Sesión inválida'));
      })
    ).subscribe();
  }

  /**
   * Autentica un usuario con sus credenciales de email y contraseña.
   * Realiza una petición POST al endpoint de login y establece la sesión si es exitoso.
   * Retorna un Observable que emite la respuesta con el usuario y el token JWT.
   */
  login(credentials: AuthInput): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Registra un nuevo usuario en el sistema.
   * Realiza una petición POST al endpoint de registro y establece la sesión automáticamente.
   * Retorna un Observable que emite la respuesta con el usuario creado y el token JWT.
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
   * Cierra la sesión del usuario eliminando el token del localStorage y limpiando el usuario actual.
   * Debe llamarse cuando el usuario hace logout o cuando se detecta una sesión inválida.
   */
  logout() {
    localStorage.removeItem('jwt_token');
    this._currentUser.set(null);
  }

  /**
   * Recarga el perfil del usuario desde la API actualizando la información en el signal.
   * Útil para refrescar los datos del usuario después de actualizaciones en el backend.
   */
  refreshUser() {
    this.loadUserProfile();
  }

  /**
   * Maneja errores HTTP transformándolos en errores manejables.
   * Extrae el mensaje de error del cuerpo de la respuesta o usa un mensaje genérico.
   */
  private handleError(error: HttpErrorResponse) {
    const errorMessage = error.error?.message || 'Error desconocido';
    return throwError(() => new Error(errorMessage));
  }
}