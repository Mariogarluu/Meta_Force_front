import { Injectable, signal } from '@angular/core';
import { Credentials, RegisterInfo } from '../models/credentials';
import { HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageAuthService {
  private readonly _user: any = {
    name: 'Juan',
    surname: 'García',
    email: 'juan@juan.es',
  };

  public user: any | null;

  constructor() {
    this.user = signal<any>(null);
    let cookie = localStorage.getItem('AUTHENTICATION');
    if (cookie) this.user.set(JSON.parse(cookie));
  }

  login(credentials: Credentials):Promise<HttpResponse<any>> {
    return new Promise((resolve, reject)=>{
      let users: RegisterInfo[] | null =
        localStorage.getItem('USERS') != null
          ? JSON.parse(localStorage.getItem('USERS')!)
          : null;
      if (
        users != null &&
        users.find(
          u=>
            u.email == credentials.email &&
            u.password == credentials.password
        )!=undefined
      ) {
        localStorage.setItem('AUTHENTICATION', JSON.stringify(credentials));
        this.user.set(credentials);
        resolve(new HttpResponse({'status':200, 'statusText':'User signed in'}));
      }
      else
        reject(new HttpResponse({'status':401, 'statusText':'Unauthorized'}))
    });
  }

  logout() {
    localStorage.removeItem('AUTHENTICATION');
    this.user.set(null);
  }

  register(userInfo: RegisterInfo):Promise<HttpResponse<any>>{
    return new Promise((resolve,reject)=>{
      let users: RegisterInfo[] | null =
            localStorage.getItem('USERS') != null
              ? JSON.parse(localStorage.getItem('USERS')!)
              : null;
      if (
        users == null ||
        users.find(u => u.email == userInfo.email, false)==undefined
      ) {
        let user = { email: userInfo.email, password: userInfo.password }
        localStorage.setItem(
          'AUTHENTICATION',
          JSON.stringify(user)
        );
        this.user.set(user);
        if(users)
          users.push(userInfo);
        else
          users = [userInfo];
        localStorage.setItem('USERS', JSON.stringify(users));
        resolve(new HttpResponse({'status':201, 'statusText':'User signed up'}));
      }
      reject(new HttpResponse({'status':403, 'statusText':'email already registered'}));
    });
    
  }
}
