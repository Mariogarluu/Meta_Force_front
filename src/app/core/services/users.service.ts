import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { User } from '../models/user';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'SUPERADMIN' | 'ADMIN_CENTER' | 'TRAINER' | 'CLEANER' | 'USER';
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  /**
   * Actualiza los datos de un usuario específico identificado por su ID.
   * Permite modificar nombre, email y/o rol según los permisos del usuario autenticado.
   * Retorna un Observable que emite el usuario actualizado.
   */
  updateUser(id: string, data: UpdateUserInput): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Obtiene la información de un usuario específico por su ID.
   * Retorna un Observable que emite el objeto User con toda su información pública.
   */
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }
}

