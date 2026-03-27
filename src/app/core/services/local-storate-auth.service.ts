import { Injectable, signal } from '@angular/core';
import { Credentials, RegisterInfo } from '../models/credentials';
import { HttpResponse } from '@angular/common/http';

/**
 * Service for managing authentication using browser LocalStorage.
 * Primarily used for mock authentication and persistence when backend is unavailable.
 */
/**
 * Service for managing authentication using browser LocalStorage.
 * Primarily used for mock authentication and persistence when backend is unavailable.
 */
@Injectable({
  providedIn: 'root',
})
export class LocalStorageAuthService {
  /** Mock default user data */
  private readonly _user: any = {
    name: 'Juan',
    surname: 'García',
    email: 'juan@juan.es',
  };

  /** Signal containing the currently authenticated user session */
  public user: any | null;

  /**
   * Initializes the service and restores the session from LocalStorage if available.
   */
  constructor() {
    this.user = signal<any>(null);
    let cookie = localStorage.getItem('AUTHENTICATION');
    if (cookie) this.user.set(JSON.parse(cookie));
  }

  /**
   * Simulates a login process by checking credentials against LocalStorage.
   * @param credentials - The user's login email and password
   * @returns Promise resolving to a successful HttpResponse or rejecting with 401
   */
  login(credentials: Credentials): Promise<HttpResponse<any>> {
    return new Promise((resolve, reject) => {
      let users: RegisterInfo[] | null =
        localStorage.getItem('USERS') != null
          ? JSON.parse(localStorage.getItem('USERS')!)
          : null;
      if (
        users != null &&
        users.find(
          u =>
            u.email == credentials.email &&
            u.password == credentials.password
        ) != undefined
      ) {
        localStorage.setItem('AUTHENTICATION', JSON.stringify(credentials));
        this.user.set(credentials);
        resolve(new HttpResponse({ 'status': 200, 'statusText': 'User signed in' }));
      }
      else
        reject(new HttpResponse({ 'status': 401, 'statusText': 'Unauthorized' }))
    });
  }

  /**
   * Logs out the user by removing their session from LocalStorage.
   */
  logout() {
    localStorage.removeItem('AUTHENTICATION');
    this.user.set(null);
  }

  /**
   * Simulates user registration by saving user info to LocalStorage.
   * @param userInfo - Detailed registration information
   * @returns Promise resolving to a successful HttpResponse or rejecting if email is taken
   */
  register(userInfo: RegisterInfo): Promise<HttpResponse<any>> {
    return new Promise((resolve, reject) => {
      let users: RegisterInfo[] | null =
        localStorage.getItem('USERS') != null
          ? JSON.parse(localStorage.getItem('USERS')!)
          : null;
      if (
        users == null ||
        users.find(u => u.email == userInfo.email, false) == undefined
      ) {
        let user = { email: userInfo.email, password: userInfo.password }
        localStorage.setItem(
          'AUTHENTICATION',
          JSON.stringify(user)
        );
        this.user.set(user);
        if (users)
          users.push(userInfo);
        else
          users = [userInfo];
        localStorage.setItem('USERS', JSON.stringify(users));
        resolve(new HttpResponse({ 'status': 201, 'statusText': 'User signed up' }));
      }
      reject(new HttpResponse({ 'status': 403, 'statusText': 'email already registered' }));
    });
  }
}

