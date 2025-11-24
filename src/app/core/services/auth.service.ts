import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../models/user';
import { AuthInput, RegisterInput, AuthResponse } from '../models/auth';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  // Se usa la variable de entorno. Angular sustituirá el archivo environment.ts 
  // por environment.development.ts automáticamente cuando uses 'ng serve'.
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private _currentUser = signal<User | null>(null);
  
  public readonly currentUser = this._currentUser.asReadonly();

  constructor() {
    const token = this.getToken();
    if (token) {
      this.loadUserProfile();
    }
  }

  private getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private setSession(authResult: AuthResponse) {
    localStorage.setItem('jwt_token', authResult.token);
    this._currentUser.set(authResult.user);
  }
  
  private loadUserProfile() {
    // Usamos environment.apiUrl directamente para construir la ruta de usuarios
    this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      tap(user => this._currentUser.set(user)),
      catchError(() => {
        this.logout();
        return throwError(() => new Error('Sesión inválida'));
      })
    ).subscribe();
  }

  login(credentials: AuthInput): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  register(data: RegisterInput): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  logout() {
    localStorage.removeItem('jwt_token');
    this._currentUser.set(null);
  }

  private handleError(error: HttpErrorResponse) {
    const errorMessage = error.error?.message || 'Error desconocido';
    return throwError(() => new Error(errorMessage));
  }
}