import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Notification } from '../models/notification';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

/**
 * =============================================================================
 * SERVICIO DE NOTIFICACIONES (NOTIFICATION SERVICE)
 * =============================================================================
 * Gestiona las alertas y notificaciones del usuario en tiempo real.
 * Implementa un mecanismo de "polling" (consulta periódica) para mantener
 * actualizado el contador de no leídos y la lista de mensajes.
 * 
 * Basado en la tabla 'Notification' de Supabase para una gestión nativa.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  /** Supabase client used to read and update rows from the Notification table. */
  private supabase = inject(SupabaseService).client;
  /** Servicio inyectado de AuthService para constatar identidad de perfil activo */
  private auth = inject(AuthService);
  /** Clave interna del temporizador de bucle polling para recudir uso de memoria al destruir */
  private intervalId: any;

  /** Signal estado de reactividad para el pool de notificaciones procesado */
  private _notifications = signal<Notification[]>([]);
  /** Signal de número de entradas no leídas */
  private _unreadCount = signal<number>(0);

  /** Signal público en modo lectura estricto del bloque notificaciones */
  public notifications = this._notifications.asReadonly();
  /** Signal público en modo lectura estricto del contador bruto */
  public unreadCount = this._unreadCount.asReadonly();

  /**
   * Inicializa la instancia del servicio y activa el hilo de reding asíncrono
   * siempre y cuando disponga de los perfiles cargados correspondientemente.
   */
  constructor() {
    if (this.auth.currentUser()) {
      this.startPolling();
    }
  }

  /**
   * Arranca el mecanismo de polling.
   * Realiza la primera carga de datos y establece un intervalo de actualización.
   */
  startPolling() {
    this.loadNotifications();
    this.loadUnreadCount();
    
    this.intervalId = setInterval(() => {
      if (this.auth.currentUser()) {
        this.loadUnreadCount();
      }
    }, 60000);
  }

  /**
   * Hook destructor del ciclo de vida diseñado para cancelar intervalos colgantes.
   */
  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /**
   * Carga el listado completo de notificaciones del usuario.
   * Recupera todos los registros de la tabla 'Notification' ordenados por fecha de creación.
   */
  loadNotifications() {
    void (async () => {
      try {
        const { data, error } = await this.supabase
          .from('Notification')
          .select('*')
          .order('createdAt', { ascending: false });
        if (error) throw error;
        this._notifications.set((data ?? []) as Notification[]);
      } catch (e: unknown) {
        console.error('Error cargando notificaciones', e);
      }
    })();
  }

  /**
   * Carga el contador de notificaciones no leídas.
   * Optimiza la consulta pidiendo solo el 'count' sin descargar todos los cuerpos de mensaje.
   */
  loadUnreadCount() {
    void (async () => {
      try {
        const { count, error } = await this.supabase
          .from('Notification')
          .select('id', { count: 'exact', head: true })
          .eq('read', false);
        if (error) throw error;
        this._unreadCount.set(count ?? 0);
      } catch (e: unknown) {
        console.error('Error cargando contador', e);
      }
    })();
  }

  /**
   * Marca una notificación específica como leída.
   * Realiza una actualización optimista en el estado local para una respuesta 
   * inmediata en la UI antes de persistir en el servidor.
   * 
   * @param id - Identificador único de la notificación.
   */
  markAsRead(id: string) {
    this._notifications.update(list => 
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this._unreadCount.update(c => Math.max(0, c - 1));

    void (async () => {
      try {
        const { error } = await this.supabase
          .from('Notification')
          .update({ read: true })
          .eq('id', id);
        if (error) throw error;
      } catch {
        this.loadNotifications();
        this.loadUnreadCount();
      }
    })();
  }

  /**
   * Marca todas las notificaciones pendientes como leídas de forma masiva.
   * Útil para la función "Limpiar todo" en el panel de notificaciones.
   */
  markAllAsRead() {
    this._notifications.update(list => list.map(n => ({ ...n, read: true })));
    this._unreadCount.set(0);

    const ids = this._notifications().filter(n => !n.read).map(n => n.id);
    if (!ids.length) return;

    return this.supabase
      .from('Notification')
      .update({ read: true })
      .in('id', ids);
  }
}
