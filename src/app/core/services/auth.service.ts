import { Injectable, inject, signal } from '@angular/core';
import { Observable, ReplaySubject, from, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { Role, User } from '../models/user';
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
        const currentUser = this._currentUser();
        // Solo cargamos el perfil si no hay un usuario cargado o si el usuario ha cambiado de ID.
        // Esto evita por completo hacer consultas redundantes en eventos como TOKEN_REFRESHED o SIGNED_IN
        // disparados al enfocar/cambiar de pestaña, eliminando cualquier posibilidad de interbloqueo.
        if (!currentUser || currentUser.id !== session.user.id) {
          await this.loadUserProfile(session.user.id);
        }
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
    const isRole = (value: unknown): value is Role =>
      value === 'SUPERADMIN' ||
      value === 'ADMIN_CENTER' ||
      value === 'TRAINER' ||
      value === 'CLEANER' ||
      value === 'USER';

    const loadRole = async (): Promise<Role> => {
      const { data, error } = await this.supabase.rpc('get_my_role');
      if (error) return 'USER';
      // Supabase devuelve array de filas para RETURNS TABLE
      const row = Array.isArray(data) ? data[0] : data;
      const role = row?.role as unknown;
      return isRole(role) ? role : 'USER';
    };

    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileError && profile) {
      const role = await loadRole();
      // Obtener detalles adicionales del perfil (como la imagen de perfil) desde la tabla User
      const { data: userDetails } = await this.supabase
        .from('User')
        .select('*')
        .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
        .maybeSingle();

      const rawUrl = userDetails?.profileImageUrl;
      const profileImageUrl = rawUrl
        ? `${rawUrl.split('?')[0]}?t=${Date.now()}`
        : null;

      this._currentUser.set({
        ...(userDetails || {}),
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role,
        profileImageUrl,
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
      const role = await loadRole();
      this._currentUser.set({ ...(legacy as User), role });
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
    // 1. Limpiar el estado local de forma sincrónica e inmediata para evitar condiciones de carrera con las rutas y guards
    this._currentUser.set(null);
    localStorage.removeItem('auth_token');

    // 2. Hacer la petición de salida de Supabase asíncronamente en segundo plano
    this.supabase.auth.signOut().catch(err => {
      console.warn('Error durante signOut remoto de Supabase, pero la sesión local fue eliminada con éxito:', err);
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

  /**
   * Cambia la contraseña del usuario actual.
   * Primero verifica la contraseña actual re-autenticando al usuario.
   * Si es correcta, procede a actualizar la contraseña con la nueva.
   * 
   * @param currentPassword - La contraseña actual del usuario.
   * @param newPassword - La nueva contraseña a establecer.
   * @returns Observable que emite un resultado exitoso o error.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const user = this._currentUser();
    if (!user || !user.email) {
      return throwError(() => new Error('No hay una sesión de usuario activa.'));
    }

    // 1. Verificar la contraseña actual haciendo una petición directa a la API REST
    const verifyUrl = `${environment.supabaseUrl}/auth/v1/token?grant_type=password`;

    return from(
      fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'apikey': environment.supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          password: currentPassword
        })
      })
    ).pipe(
      switchMap(async (response) => {
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error_description || 'La contraseña actual es incorrecta.');
        }
        return true;
      }),
      switchMap(async () => {
        // 2. Obtener el token de acceso de la sesión activa
        const { data: { session } } = await this.supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          throw new Error('No se pudo verificar la sesión activa para actualizar la contraseña.');
        }

        // 3. Actualizar la contraseña a través de la API REST usando el token de acceso
        const updateUrl = `${environment.supabaseUrl}/auth/v1/user`;
        const updateResponse = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'apikey': environment.supabaseKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: newPassword
          })
        });

        if (!updateResponse.ok) {
          const errData = await updateResponse.json().catch(() => ({}));
          throw new Error(errData.error_description || 'Error al actualizar la contraseña.');
        }

        return true;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }
}