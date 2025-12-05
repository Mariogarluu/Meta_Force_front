import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { User, Role, UserStatus } from '../models/user';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  status?: UserStatus;
  favoriteCenterId?: string | null; // Solo se puede cambiar favoriteCenterId, no centerId
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  /**
   * Lista todos los usuarios visibles para el usuario autenticado.
   * SUPERADMIN ve todos, ADMIN_CENTER solo usuarios de su centro.
   */
  listUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  /**
   * Actualiza los datos de un usuario específico identificado por su ID.
   * Permite modificar nombre, email, rol, estado y centro según los permisos del usuario autenticado.
   */
  updateUser(id: string, data: UpdateUserInput): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina un usuario por su ID.
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene la información de un usuario específico por su ID.
   * Retorna un Observable que emite el objeto User con toda su información pública.
   */
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Sube una imagen de perfil para el usuario autenticado.
   * @param file - Archivo de imagen a subir
   * @returns Observable que emite el usuario actualizado con la nueva URL de imagen
   */
  uploadProfileImage(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<User>(`${this.apiUrl}/me/profile-image`, formData);
  }

  /**
   * Elimina la imagen de perfil del usuario autenticado.
   * @returns Observable que emite el usuario actualizado con profileImageUrl en null
   */
  deleteProfileImage(): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/me/profile-image`);
  }
}

