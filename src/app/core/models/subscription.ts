/**
 * Nuevos modelos de suscripciones basados en SCRUM-18.
 * Separados de MembershipPlan (legacy) para evitar confusiones.
 */

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  position: number;
  active: boolean;
}

export interface PlanDuration {
  id: string;
  months: number;
  label: string;
  active: boolean;
}

export interface PlanPrice {
  planId: string;
  durationId: string;
  price: number;
  taxRate: number;
  active: boolean;
}

export type SpecialOfferDiscountType = 'percent' | 'amount';

export interface SpecialOffer {
  id: string;
  name: string;
  planId?: string | null;
  durationId?: string | null;
  discountType: SpecialOfferDiscountType;
  discountValue: number;
  validFrom?: string | null;
  validTo?: string | null;
  active: boolean;
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureText: string;
  position: number;
}

/**
 * Resultado ligero de búsqueda de usuarios para staff.
 */
export interface UserLite {
  id: string;
  name: string;
  email: string;
}

/**
 * Resultado devuelto por la RPC register_subscription.
 */
export interface RegisterSubscriptionResponse {
  subscription_id: string;
  invoice_id: string;
}

export interface IssuerSettings {
  id: boolean;
  legalName: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
  iban: string;
  logoUrl?: string | null;
}

