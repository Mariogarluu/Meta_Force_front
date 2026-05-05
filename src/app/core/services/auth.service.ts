import { Injectable, inject, signal } from '@angular/core';
import { Observable, ReplaySubject, from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User } from '../models/user';
import { AuthInput, RegisterInput, AuthResponse } from '../models/auth';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

/**
 * =============================================================================
 * SERVICIO DE AUTENTICACIÓN (AUTH SERVICE)
 * =============================================================================
 * Este servicio centraliza la gestión de sesiones de usuario utilizando
 * Supabase Auth como proveedor de identidad. 
 * 
 * Responsabilidades:
 * 1. Inicializar y escuchar cambios en el estado de autenticación.
 * 2. Cargar perfiles de usuario desde tablas nativas o legacy.
 * 3. Gestionar flujos de Login, Registro y Logout.
 * 4. Proveer un estado reactivo del usuario actual mediante Angular Signals.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Shared Supabase auth client used as the single source of truth for sessions. */
  private supabase = inject(SupabaseService).client;
  /** Internal signal holding the currently authenticated user (if any). */
  private _currentUser = signal<User | null>(null);

  /** Read‑only signal exposed to components with the current user state. */
  public readonly currentUser = this._currentUser.asReadonly();
  /** Emits once when the initial session + profile load has finished. */
  private _initialLoadComplete = new ReplaySubject<boolean>(1);
  /** Observable view of the initialisation status for route guards, etc. */
  public readonly initialLoadComplete = this._initialLoadComplete.asObservable();

  /**
   * Eagerly initialises the auth session on service construction so consumers
   * can safely subscribe to `currentUser` and `initialLoadComplete`.
   */
  constructor() {
    this.initSession();
  }

  /**
   * Inicializa la sesión del usuario al arrancar el servicio.
   * Recupera la sesión actual y establece un listener para detectar cambios 
   * en tiempo real (login, logout, token refrescado).
   */
  private async initSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      await this.loadUserProfile(session.user.id);
    } else {
      this._initialLoadComplete.next(true);
    }

    this.supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session) {
        await this.loadUserProfile(session.user.id);
      } else {
        this._currentUser.set(null);
      }
    });
  }

  /**
   * Carga la información detallada del perfil del usuario.
   * Implementa una lógica de fallback:
   * 1. Intenta cargar desde la nueva tabla 'profiles' (Arquitectura Nativa Supabase).
   * 2. Si falla, intenta recuperar desde la tabla 'User' (Arquitectura Legacy).
   * 
   * @param userId - El identificador único del usuario en Supabase Auth.
   */
  private async loadUserProfile(userId: string) {
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileError && profile) {
      this._currentUser.set({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        status: profile.status,
      } as unknown as User);
      this._initialLoadComplete.next(true);
      return;
    }

    const { data: legacy, error: legacyError } = await this.supabase
      .from('User')
      .select('*')
      .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
      .maybeSingle();

    if (legacyError) {
      console.error('Error loading user profile:', legacyError);
      this._currentUser.set(null);
    } else {
      this._currentUser.set(legacy as User);
    }
    this._initialLoadComplete.next(true);
  }

  /**
   * Autentica a un usuario mediante correo y contraseña.
   * Utiliza el método signInWithPassword de Supabase.
   * 
   * @param credentials - Objeto con email y password del usuario.
   * @returns Observable que emite la respuesta de la operación de Supabase.
   */
  login(credentials: AuthInput): Observable<any> {
    return from(this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password!
    })).pipe(
      tap(({ data, error }) => {
        if (error) throw error;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Registra un nuevo usuario en la plataforma.
   * Crea la cuenta en Supabase Auth y añade metadatos adicionales como el nombre.
   * 
   * @param data - Datos de registro (email, password, nombre).
   * @returns Observable con el resultado del registro.
   */
  register(data: RegisterInput): Observable<any> {
    return from(this.supabase.auth.signUp({
      email: data.email,
      password: data.password!,
      options: {
        data: {
          name: data.name
        }
      }
    })).pipe(
      tap(({ error }) => {
        if (error) throw error;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Cierra la sesión activa del usuario.
   * Limpia tanto la sesión en Supabase como el estado local (Signals y tokens antiguos).
   */
  logout() {
    this.supabase.auth.signOut().then(() => {
      this._currentUser.set(null);
      localStorage.removeItem('auth_token');
    });
  }

  /**
   * Forzado de recarga de los datos del perfil del usuario actual.
   * Útil tras realizar actualizaciones en el perfil de usuario.
   */
  refreshUser() {
    const user = this._currentUser();
    if (user) {
      this.loadUserProfile(user.id);
    }
  }
}