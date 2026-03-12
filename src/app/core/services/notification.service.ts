import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification';
import { AuthService } from './auth.service';

/**
 * Service for managing user notifications and unread counts.
 * Implements a polling mechanism to keep the notification state synchronized with the backend.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/notifications`;
  private intervalId: any;

  // Estado reactivo
  private _notifications = signal<Notification[]>([]);
  private _unreadCount = signal<number>(0);

  // Exponer señales de lectura
  public notifications = this._notifications.asReadonly();
  public unreadCount = this._unreadCount.asReadonly();

  constructor() {
    // Iniciar polling solo si hay usuario
    if (this.auth.currentUser()) {
      this.startPolling();
    }
  }

  startPolling() {
    this.loadNotifications();
    this.loadUnreadCount();
    
    // Actualizar cada 60 segundos
    this.intervalId = setInterval(() => {
      if (this.auth.currentUser()) {
        this.loadUnreadCount();
      }
    }, 60000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  loadNotifications() {
    this.http.get<Notification[]>(this.apiUrl).subscribe({
      next: (data) => this._notifications.set(data),
      error: (e) => console.error('Error cargando notificaciones', e)
    });
  }

  loadUnreadCount() {
    this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).subscribe({
      next: (data) => this._unreadCount.set(data.count),
      error: (e) => console.error('Error cargando contador', e)
    });
  }

  markAsRead(id: string) {
    // Actualización optimista
    this._notifications.update(list => 
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this._unreadCount.update(c => Math.max(0, c - 1));

    return this.http.patch(`${this.apiUrl}/${id}/read`, {}).subscribe({
      error: () => {
        // Revertir si falla (opcional, por simplicidad recargamos)
        this.loadNotifications();
        this.loadUnreadCount();
      }
    });
  }

  markAllAsRead() {
    this._notifications.update(list => list.map(n => ({ ...n, read: true })));
    this._unreadCount.set(0);

    return this.http.patch(`${this.apiUrl}/read-all`, {}).subscribe();
  }
}