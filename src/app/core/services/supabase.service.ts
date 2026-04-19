import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * =============================================================================
 * SERVICIO DE SUPABASE (SUPABASE SERVICE)
 * =============================================================================
 * Este servicio actúa como el punto de acceso central para el cliente de Supabase.
 * Proporciona una instancia configurada del SupabaseClient para que sea 
 * inyectada en otros servicios.
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  /**
   * Devuelve la instancia del cliente de Supabase.
   * Permite realizar operaciones CRUD, autenticación y storage.
   */
  get client(): SupabaseClient {
    return this.supabase;
  }
}
