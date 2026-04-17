import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Keep for other services if needed
import { Observable, ReplaySubject, from, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User } from '../models/user';
import { AuthInput, RegisterInput, AuthResponse } from '../models/auth';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private _currentUser = signal<User | null>(null);

  public readonly currentUser = this._currentUser.asReadonly();
  private _initialLoadComplete = new ReplaySubject<boolean>(1);
  public readonly initialLoadComplete = this._initialLoadComplete.asObservable();

  constructor() {
    this.initSession();
  }

  /**
   * Initializes the session by listening to auth state changes.
   */
  private async initSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      await this.loadUserProfile(session.user.id);
    } else {
      this._initialLoadComplete.next(true);
    }

    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await this.loadUserProfile(session.user.id);
      } else {
        this._currentUser.set(null);
      }
    });
  }

  /**
   * Loads user profile from Supabase (profiles as canonical, fallback to legacy User).
   */
  private async loadUserProfile(userId: string) {
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileError && profile) {
      // Minimal shape compatibility with existing User model
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
   * Authenticates with Supabase Auth.
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
   * Registers with Supabase Auth.
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
   * Logs out from Supabase Auth.
   */
  logout() {
    this.supabase.auth.signOut().then(() => {
      this._currentUser.set(null);
      localStorage.removeItem('auth_token'); // Clean up old token if any
    });
  }

  refreshUser() {
    const user = this._currentUser();
    if (user) {
      this.loadUserProfile(user.id);
    }
  }
}