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
  /** Injected HttpClient for notification API calls */
  private http = inject(HttpClient);
  /** Injected AuthService to check user authentication state */
  private auth = inject(AuthService);
  /** Base API URL for notification operations */
  private apiUrl = `${environment.apiUrl}/notifications`;
  /** ID of the polling interval, used for cleanup on destroy */
  private intervalId: any;

  /** Reactive signal for the list of notifications */
  private _notifications = signal<Notification[]>([]);
  /** Reactive signal for the count of unread notifications */
  private _unreadCount = signal<number>(0);

  /** Public read-only signal of the notifications list */
  public notifications = this._notifications.asReadonly();
  /** Public read-only signal of the unread count */
  public unreadCount = this._unreadCount.asReadonly();

  /**
   * Initializes the service and starts polling if a user is already authenticated.
   */
  constructor() {
    // Iniciar polling solo si hay usuario
    if (this.auth.currentUser()) {
      this.startPolling();
    }
  }

  /**
   * Starts the polling mechanism to periodically fetch the unread notification count.
   */
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

  /**
   * Lifecycle hook that cleans up the interval timer when the service is destroyed.
   */
  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /**
   * Loads the full list of notifications from the server.
   */
  loadNotifications() {
    this.http.get<Notification[]>(this.apiUrl).subscribe({
      next: (data) => this._notifications.set(data),
      error: (e) => console.error('Error cargando notificaciones', e)
    });
  }

  /**
   * Loads the unread notification count from the server.
   */
  loadUnreadCount() {
    this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).subscribe({
      next: (data) => this._unreadCount.set(data.count),
      error: (e) => console.error('Error cargando contador', e)
    });
  }

  /**
   * Marks a specific notification as read.
   * Performs an optimistic update of the local state.
   * @param id - The ID of the notification to mark as read
   */
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

  /**
   * Marks all notifications as read for the current user.
   */
  markAllAsRead() {
    this._notifications.update(list => list.map(n => ({ ...n, read: true })));
    this._unreadCount.set(0);

    return this.http.patch(`${this.apiUrl}/read-all`, {}).subscribe();
  }
}