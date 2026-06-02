import { Injectable, inject } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import {
  SubscriptionPlan,
  PlanDuration,
  PlanPrice,
  SpecialOffer,
  PlanFeature,
  IssuerSettings,
  UserLite,
  RegisterSubscriptionResponse,
} from '../models/subscription';

/**
 * Servicio para gestionar el catálogo de suscripciones y el registro
 * de nuevas suscripciones vía RPC `register_subscription`.
 *
 * Pensado para roles SUPERADMIN / ADMIN_CENTER en el frontend Angular.
 */
@Injectable({
  providedIn: 'root',
})
export class SubscriptionsService {
  /** Cliente Supabase para operaciones directas sobre Postgres. */
  private supabase = inject(SupabaseService).client;

  /** Lista todos los planes de suscripción disponibles. */
  listPlans(): Observable<SubscriptionPlan[]> {
    return from(
      this.supabase
        .from('subscription_plans')
        .select(
          'id, code, name, description, position, active',
        )
        .order('position', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as any[];
        return rows.map((row) => ({
          id: row.id as string,
          code: row.code as string,
          name: row.name as string,
          description: (row.description as string | null) ?? undefined,
          position: row.position as number,
          active: !!row.active,
        })) as SubscriptionPlan[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /** Lista todas las duraciones configuradas. */
  listDurations(): Observable<PlanDuration[]> {
    return from(
      this.supabase
        .from('plan_durations')
        .select('id, months, label, active')
        .order('months', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as any[];
        return rows.map((row) => ({
          id: row.id as string,
          months: row.months as number,
          label: row.label as string,
          active: !!row.active,
        })) as PlanDuration[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /** Lista todos los precios plan × duración. */
  listPrices(): Observable<PlanPrice[]> {
    return from(
      this.supabase
        .from('plan_prices')
        .select('plan_id, duration_id, price, tax_rate, active')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as any[];
        return rows.map((row) => ({
          planId: row.plan_id as string,
          durationId: row.duration_id as string,
          price: Number(row.price),
          taxRate: Number(row.tax_rate),
          active: !!row.active,
        })) as PlanPrice[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /** Lista todas las ofertas especiales. */
  listOffers(): Observable<SpecialOffer[]> {
    return from(
      this.supabase
        .from('special_offers')
        .select(
          'id, name, plan_id, duration_id, discount_type, discount_value, valid_from, valid_to, active',
        )
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as any[];
        return rows.map((row) => ({
          id: row.id as string,
          name: row.name as string,
          planId: (row.plan_id as string | null) ?? null,
          durationId: (row.duration_id as string | null) ?? null,
          discountType: row.discount_type as 'percent' | 'amount',
          discountValue: Number(row.discount_value),
          validFrom: (row.valid_from as string | null) ?? null,
          validTo: (row.valid_to as string | null) ?? null,
          active: !!row.active,
        })) as SpecialOffer[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /** Lista las features de los planes, opcionalmente filtradas por plan. */
  listFeatures(planId?: string): Observable<PlanFeature[]> {
    const query = this.supabase
      .from('plan_features')
      .select('id, plan_id, feature_text, position')
      .order('position', { ascending: true });

    const finalQuery = planId ? query.eq('plan_id', planId) : query;

    return from(finalQuery).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as any[];
        return rows.map((row) => ({
          id: row.id as string,
          planId: row.plan_id as string,
          featureText: row.feature_text as string,
          position: row.position as number,
        })) as PlanFeature[];
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Crea un nuevo plan. */
  createPlan(payload: Omit<SubscriptionPlan, 'id'>): Observable<SubscriptionPlan> {
    return from(
      this.supabase
        .from('subscription_plans')
        .insert({
          code: payload.code,
          name: payload.name,
          description: payload.description ?? null,
          position: payload.position,
          active: payload.active,
        })
        .select('id, code, name, description, position, active')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          id: row.id as string,
          code: row.code as string,
          name: row.name as string,
          description: (row.description as string | null) ?? undefined,
          position: row.position as number,
          active: !!row.active,
        } as SubscriptionPlan;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Actualiza un plan existente. */
  updatePlan(plan: SubscriptionPlan): Observable<SubscriptionPlan> {
    return from(
      this.supabase
        .from('subscription_plans')
        .update({
          code: plan.code,
          name: plan.name,
          description: plan.description ?? null,
          position: plan.position,
          active: plan.active,
        })
        .eq('id', plan.id)
        .select('id, code, name, description, position, active')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          id: row.id as string,
          code: row.code as string,
          name: row.name as string,
          description: (row.description as string | null) ?? undefined,
          position: row.position as number,
          active: !!row.active,
        } as SubscriptionPlan;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Elimina un plan. */
  deletePlan(id: string): Observable<void> {
    return from(
      this.supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Crea una nueva feature de plan. */
  createFeature(payload: Omit<PlanFeature, 'id'>): Observable<PlanFeature> {
    return from(
      this.supabase
        .from('plan_features')
        .insert({
          plan_id: payload.planId,
          feature_text: payload.featureText,
          position: payload.position,
        })
        .select('id, plan_id, feature_text, position')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          id: row.id as string,
          planId: row.plan_id as string,
          featureText: row.feature_text as string,
          position: row.position as number,
        } as PlanFeature;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Actualiza una feature existente. */
  updateFeature(feature: PlanFeature): Observable<PlanFeature> {
    return from(
      this.supabase
        .from('plan_features')
        .update({
          plan_id: feature.planId,
          feature_text: feature.featureText,
          position: feature.position,
        })
        .eq('id', feature.id)
        .select('id, plan_id, feature_text, position')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          id: row.id as string,
          planId: row.plan_id as string,
          featureText: row.feature_text as string,
          position: row.position as number,
        } as PlanFeature;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Elimina una feature de plan. */
  deleteFeature(id: string): Observable<void> {
    return from(
      this.supabase
        .from('plan_features')
        .delete()
        .eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Crea una nueva duración. */
  createDuration(payload: Omit<PlanDuration, 'id'>): Observable<PlanDuration> {
    return from(
      this.supabase
        .from('plan_durations')
        .insert({
          months: payload.months,
          label: payload.label,
          active: payload.active,
        })
        .select('id, months, label, active')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          id: row.id as string,
          months: row.months as number,
          label: row.label as string,
          active: !!row.active,
        } as PlanDuration;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Actualiza una duración. */
  updateDuration(duration: PlanDuration): Observable<PlanDuration> {
    return from(
      this.supabase
        .from('plan_durations')
        .update({
          months: duration.months,
          label: duration.label,
          active: duration.active,
        })
        .eq('id', duration.id)
        .select('id, months, label, active')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          id: row.id as string,
          months: row.months as number,
          label: row.label as string,
          active: !!row.active,
        } as PlanDuration;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Elimina una duración. */
  deleteDuration(id: string): Observable<void> {
    return from(
      this.supabase
        .from('plan_durations')
        .delete()
        .eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Crea un nuevo precio plan × duración. */
  createPrice(payload: PlanPrice): Observable<PlanPrice> {
    return from(
      this.supabase
        .from('plan_prices')
        .insert({
          plan_id: payload.planId,
          duration_id: payload.durationId,
          price: payload.price,
          tax_rate: payload.taxRate,
          active: payload.active,
        })
        .select('plan_id, duration_id, price, tax_rate, active')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          planId: row.plan_id as string,
          durationId: row.duration_id as string,
          price: Number(row.price),
          taxRate: Number(row.tax_rate),
          active: !!row.active,
        } as PlanPrice;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Actualiza un precio existente. */
  updatePrice(payload: PlanPrice): Observable<PlanPrice> {
    return from(
      this.supabase
        .from('plan_prices')
        .update({
          price: payload.price,
          tax_rate: payload.taxRate,
          active: payload.active,
        })
        .eq('plan_id', payload.planId)
        .eq('duration_id', payload.durationId)
        .select('plan_id, duration_id, price, tax_rate, active')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          planId: row.plan_id as string,
          durationId: row.duration_id as string,
          price: Number(row.price),
          taxRate: Number(row.tax_rate),
          active: !!row.active,
        } as PlanPrice;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Elimina un precio (por PK compuesta). */
  deletePrice(planId: string, durationId: string): Observable<void> {
    return from(
      this.supabase
        .from('plan_prices')
        .delete()
        .eq('plan_id', planId)
        .eq('duration_id', durationId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Crea una nueva oferta especial. */
  createOffer(payload: Omit<SpecialOffer, 'id'>): Observable<SpecialOffer> {
    return from(
      this.supabase
        .from('special_offers')
        .insert({
          name: payload.name,
          plan_id: payload.planId ?? null,
          duration_id: payload.durationId ?? null,
          discount_type: payload.discountType,
          discount_value: payload.discountValue,
          valid_from: payload.validFrom ?? null,
          valid_to: payload.validTo ?? null,
          active: payload.active,
        })
        .select(
          'id, name, plan_id, duration_id, discount_type, discount_value, valid_from, valid_to, active',
        )
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          id: row.id as string,
          name: row.name as string,
          planId: (row.plan_id as string | null) ?? null,
          durationId: (row.duration_id as string | null) ?? null,
          discountType: row.discount_type as 'percent' | 'amount',
          discountValue: Number(row.discount_value),
          validFrom: (row.valid_from as string | null) ?? null,
          validTo: (row.valid_to as string | null) ?? null,
          active: !!row.active,
        } as SpecialOffer;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Actualiza una oferta. */
  updateOffer(offer: SpecialOffer): Observable<SpecialOffer> {
    return from(
      this.supabase
        .from('special_offers')
        .update({
          name: offer.name,
          plan_id: offer.planId ?? null,
          duration_id: offer.durationId ?? null,
          discount_type: offer.discountType,
          discount_value: offer.discountValue,
          valid_from: offer.validFrom ?? null,
          valid_to: offer.validTo ?? null,
          active: offer.active,
        })
        .eq('id', offer.id)
        .select(
          'id, name, plan_id, duration_id, discount_type, discount_value, valid_from, valid_to, active',
        )
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          id: row.id as string,
          name: row.name as string,
          planId: (row.plan_id as string | null) ?? null,
          durationId: (row.duration_id as string | null) ?? null,
          discountType: row.discount_type as 'percent' | 'amount',
          discountValue: Number(row.discount_value),
          validFrom: (row.valid_from as string | null) ?? null,
          validTo: (row.valid_to as string | null) ?? null,
          active: !!row.active,
        } as SpecialOffer;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Elimina una oferta. */
  deleteOffer(id: string): Observable<void> {
    return from(
      this.supabase
        .from('special_offers')
        .delete()
        .eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /** Obtiene la configuración fiscal del emisor (singleton). */
  getIssuerSettings(): Observable<IssuerSettings | null> {
    return from(
      this.supabase
        .from('issuer_settings')
        .select(
          'id, legal_name, tax_id, address, email, phone, iban, logo_url',
        )
        .limit(1)
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) return null;
        const row = data as any;
        return {
          id: Boolean(row.id),
          legalName: row.legal_name as string,
          taxId: row.tax_id as string,
          address: row.address as string,
          email: row.email as string,
          phone: row.phone as string,
          iban: row.iban as string,
          logoUrl: (row.logo_url as string | null) ?? null,
        } as IssuerSettings;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /**
   * Actualiza (o crea si no existe) la configuración fiscal del emisor.
   * Se basa en upsert sobre la tabla singleton.
   */
  updateIssuerSettings(payload: Omit<IssuerSettings, 'id'> & { id?: boolean }): Observable<IssuerSettings> {
    return from(
      this.supabase
        .from('issuer_settings')
        .upsert({
          id: payload.id,
          legal_name: payload.legalName,
          tax_id: payload.taxId,
          address: payload.address,
          email: payload.email,
          phone: payload.phone,
          iban: payload.iban,
          logo_url: payload.logoUrl ?? null,
        }, { onConflict: 'id' })
        .select(
          'id, legal_name, tax_id, address, email, phone, iban, logo_url',
        )
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const row = data as any;
        return {
          id: Boolean(row.id),
          legalName: row.legal_name as string,
          taxId: row.tax_id as string,
          address: row.address as string,
          email: row.email as string,
          phone: row.phone as string,
          iban: row.iban as string,
          logoUrl: (row.logo_url as string | null) ?? null,
        } as IssuerSettings;
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /**
   * Búsqueda sencilla de usuarios por email o nombre exacto.
   * RLS en Supabase se encarga de restringir resultados según rol.
   */
  searchUsers(query: string): Observable<UserLite[]> {
    const trimmed = query.trim();
    let dbQuery = this.supabase.from('User').select('*').limit(20);

    if (trimmed) {
      dbQuery = dbQuery.or(`email.ilike.%${trimmed}%,name.ilike.%${trimmed}%`);
    }

    return from(dbQuery).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as any[];
        return rows.map(row => ({
          id: (row.auth_user_id || row.id) as string,
          name: (row.name as string) || (row.email as string),
          email: row.email as string,
          profileImageUrl: row.profileImageUrl as string | null,
        })) as UserLite[];
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Llama a la RPC `register_subscription` para registrar un nuevo cobro.
   *
   * La función SQL devuelve una tabla con subscription_id e invoice_id
   * que Supabase expone como array de objetos.
   */
  registerSubscription(params: {
    userId: string;
    planId: string;
    durationId: string;
    offerId?: string | null;
  }): Observable<RegisterSubscriptionResponse> {
    return from(
      this.supabase.rpc('register_subscription', {
        p_user_id: params.userId,
        p_plan_id: params.planId,
        p_duration_id: params.durationId,
        p_offer_id: params.offerId ?? null,
      })
    ).pipe(
      map((result: any) => {
        // Supabase JS devuelve `data` y `error` o directamente el array
        const data = Array.isArray(result?.data) ? result.data : result;
        if (result?.error) {
          throw result.error;
        }
        const first = (data ?? [])[0] as RegisterSubscriptionResponse | undefined;
        if (!first) {
          throw new Error('empty_register_subscription_response');
        }
        return first;
      }),
      catchError(err => throwError(() => new Error(err.message)))
    );
  }

  /**
   * Regenera el PDF de una factura llamando a la Edge Function `invoice-pdf`.
   */
  regenerateInvoicePdf(invoiceId: string): Observable<{ url: string; path: string }> {
    return from(
      this.supabase.functions.invoke('invoice-pdf', {
        body: { invoice_id: invoiceId },
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as { url: string; path: string };
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }

  /**
   * Reenvía el email de suscripción llamando a la Edge Function `subscription-email`.
   */
  resendSubscriptionEmail(subscriptionId: string): Observable<{ id: string | null }> {
    return from(
      this.supabase.functions.invoke('subscription-email', {
        body: { subscription_id: subscriptionId },
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as { id: string | null };
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }
}

