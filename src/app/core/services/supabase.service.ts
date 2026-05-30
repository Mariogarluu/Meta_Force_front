import { Injectable, NgZone, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Helper to wrap any standard Promise to execute its .then() and .catch()
 * callbacks inside the Angular Zone.
 */
function wrapPromise(promise: Promise<any> | any, zone: NgZone): any {
  if (!promise || typeof promise.then !== 'function') {
    return promise;
  }
  return new Proxy(promise, {
    get(target: any, prop: string | symbol, receiver: any) {
      const val = Reflect.get(target, prop, receiver);
      if (prop === 'then' && typeof val === 'function') {
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
      return val;
    }
  });
}

/**
 * Helper to recursively wrap Supabase Postgrest builders/queries.
 * Ensures that chaining methods (like .select(), .eq(), etc.) still returns
 * wrapped objects, and the eventual .then() is intercepted and run inside NgZone.
 */
function wrapQueryBuilder(builder: any, zone: NgZone): any {
  if (!builder) return builder;
  return new Proxy(builder, {
    get(target: any, prop: string | symbol, receiver: any) {
      const val = Reflect.get(target, prop, receiver);
      if (prop === 'then' && typeof val === 'function') {
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
 * Helper to wrap Auth and Storage services.
 * Intercepts method calls and wraps any returned Promises in NgZone.
 */
function wrapMethods(service: any, zone: NgZone): any {
  if (!service || (typeof service !== 'object' && typeof service !== 'function')) {
    return service;
  }
  return new Proxy(service, {
    get(target: any, prop: string | symbol, receiver: any) {
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return function(...args: any[]) {
          const result = val.apply(target, args);
          if (result && typeof result.then === 'function') {
            return wrapPromise(result, zone);
          }
          return wrapMethods(result, zone);
        };
      }
      return wrapMethods(val, zone);
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
 * Se utiliza un Proxy para interceptar de forma transparente todas las promesas y 
 * consultas de Supabase y forzar su resolución dentro de la Zona de Angular (NgZone), 
 * evitando bloqueos de carga (isLoading) o actualizaciones de UI fuera de zona.
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  /** Injected NgZone to ensure all asynchronous callbacks run inside Angular's execution context */
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
   * Esto intercepta las llamadas a `from()`, `auth` y `storage` para asegurar
   * que cualquier promesa resultante se resuelva dentro de Angular's NgZone.
   */
  get client(): SupabaseClient {
    const zone = this.zone;
    return new Proxy(this.supabase, {
      get(target: any, prop: string | symbol, receiver: any) {
        const val = Reflect.get(target, prop, receiver);
        if (prop === 'from' && typeof val === 'function') {
          return function(...args: any[]) {
            const queryBuilder = val.apply(target, args);
            return wrapQueryBuilder(queryBuilder, zone);
          };
        }
        if (prop === 'auth') {
          return wrapMethods(val, zone);
        }
        if (prop === 'storage') {
          return wrapMethods(val, zone);
        }
        return val;
      }
    });
  }
}
