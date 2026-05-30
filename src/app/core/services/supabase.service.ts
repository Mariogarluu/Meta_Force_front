import { Injectable, NgZone, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Helper to recursively wrap Supabase Postgrest builders/queries.
 * Ensures that chaining methods (like .select(), .eq(), etc.) still returns
 * wrapped objects, and the eventual .then() is intercepted and run inside NgZone.
 */
function wrapQueryBuilder(builder: any, zone: NgZone): any {
  if (!builder) return builder;
  return new Proxy(builder, {
    get(target: any, prop: string | symbol, receiver: any) {
      if (prop === 'then') {
        const val = target[prop];
        if (typeof val === 'function') {
          return function(onfulfilled?: any, onrejected?: any) {
            const wrappedFulfilled = onfulfilled
              ? (v: any) => zone.run(() => onfulfilled(v))
              : undefined;
            const wrappedRejected = onrejected
              ? (e: any) => zone.run(() => onrejected(e))
              : undefined;
            return val.call(target, wrappedFulfilled, wrappedRejected);
          };
        }
      }
      const val = target[prop];
      if (typeof val === 'function') {
        return function(...args: any[]) {
          const result = val.apply(target, args);
          return wrapQueryBuilder(result, zone);
        };
      }
      return val;
    }
  });
}

/**
 * =============================================================================
 * SERVICIO DE SUPABASE (SUPABASE SERVICE)
 * =============================================================================
 * Este servicio actúa como el punto de acceso central para el cliente de Supabase.
 * Proporciona una instancia configurada del SupabaseClient para que sea 
 * inyectada en otros servicios.
 * 
 * Se utiliza un Proxy para interceptar de forma transparente todas las consultas
 * de base de datos de Supabase (.from()) y forzar su resolución dentro de la 
 * Zona de Angular (NgZone), evitando bloqueos de carga (isLoading) o 
 * actualizaciones de UI fuera de zona.
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  /** Injected NgZone to ensure all asynchronous database callbacks run inside Angular's execution context */
  private zone = inject(NgZone);
  /** Lazily‑constructed Supabase client shared across the Angular application. */
  private supabase: SupabaseClient;

  /**
   * Builds a new Supabase client using the environment configuration.
   */
  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  /**
   * Devuelve la instancia del cliente de Supabase envuelta en un Proxy.
   * Esto intercepta únicamente las llamadas a `from()` para asegurar que
   * cualquier consulta resultante se resuelva dentro de Angular's NgZone,
   * manteniendo el resto de métodos y propiedades de auth y storage intactos
   * y enlazados a su receptor original para evitar errores de contexto.
   */
  get client(): SupabaseClient {
    const zone = this.zone;
    return new Proxy(this.supabase, {
      get(target: any, prop: string | symbol, receiver: any) {
        if (prop === 'from') {
          const val = target[prop];
          if (typeof val === 'function') {
            return function(...args: any[]) {
              const queryBuilder = val.apply(target, args);
              return wrapQueryBuilder(queryBuilder, zone);
            };
          }
        }
        const val = target[prop];
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    });
  }
}
