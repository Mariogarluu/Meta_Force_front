import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SubscriptionsService } from '../../core/services/subscriptions.service';
import {
  PlanDuration,
  PlanFeature,
  PlanPrice,
  SubscriptionPlan,
} from '../../core/models/subscription';

/**
 * Página pública de precios basada en el catálogo de Suscripciones.
 * Reemplaza la lógica legacy de MembershipPlan.
 */
@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [CommonModule, TranslateModule, NavbarComponent],
  templateUrl: './memberships.component.html',
  styleUrl: './memberships.component.scss',
})
export class MembershipsComponent implements OnInit {
  private subscriptionsService = inject(SubscriptionsService);
  private translate = inject(TranslateService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string>('');

  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly durations = signal<PlanDuration[]>([]);
  readonly prices = signal<PlanPrice[]>([]);
  readonly features = signal<PlanFeature[]>([]);

  readonly activePlans = computed(() =>
    this.plans().filter((p) => p.active).sort((a, b) => a.position - b.position),
  );

  readonly activeDurations = computed(() =>
    this.durations().filter((d) => d.active).sort((a, b) => a.months - b.months),
  );

  readonly priceByKey = computed(() => {
    const map = new Map<string, PlanPrice>();
    for (const price of this.prices()) {
      if (!price.active) continue;
      map.set(`${price.planId}:${price.durationId}`, price);
    }
    return map;
  });

  readonly featuresByPlan = computed(() => {
    const byPlan = new Map<string, PlanFeature[]>();
    for (const f of this.features()) {
      if (!byPlan.has(f.planId)) byPlan.set(f.planId, []);
      byPlan.get(f.planId)!.push(f);
    }
    for (const [planId, list] of byPlan.entries()) {
      byPlan.set(
        planId,
        [...list].sort((a, b) => a.position - b.position),
      );
    }
    return byPlan;
  });

  ngOnInit(): void {
    this.loadPublicPricing();
  }

  private loadPublicPricing(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.subscriptionsService.listPlans().subscribe({
      next: (plans) => this.plans.set(plans),
      error: (err) => this.setError(err),
    });

    this.subscriptionsService.listDurations().subscribe({
      next: (durations) => this.durations.set(durations),
      error: (err) => this.setError(err),
    });

    this.subscriptionsService.listPrices().subscribe({
      next: (prices) => this.prices.set(prices),
      error: (err) => this.setError(err),
    });

    this.subscriptionsService.listFeatures().subscribe({
      next: (features) => {
        this.features.set(features);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.setError(err);
        this.isLoading.set(false);
      },
    });
  }

  private setError(err: unknown): void {
    const message = err instanceof Error ? err.message : this.translate.instant('common.errors.unexpected');
    this.errorMessage.set(message);
  }

  getCellPrice(planId: string, durationId: string): PlanPrice | undefined {
    return this.priceByKey().get(`${planId}:${durationId}`);
  }

  formatPrice(value: number): string {
    const lang = this.translate.currentLang || 'es';
    const locale = lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
  }

  calcTotalWithTax(price: PlanPrice): number {
    const taxRate = Number.isFinite(price.taxRate) ? price.taxRate : 0;
    return price.price * (1 + taxRate / 100);
  }

  calcPerMonthTotal(price: PlanPrice, months: number): number {
    const total = this.calcTotalWithTax(price);
    return months > 0 ? total / months : total;
  }
}


