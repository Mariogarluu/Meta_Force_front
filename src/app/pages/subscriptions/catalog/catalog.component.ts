import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import {
  SubscriptionPlan,
  PlanDuration,
  PlanPrice,
  PlanFeature,
  SpecialOffer,
  IssuerSettings,
} from '../../../core/models/subscription';
import { SubscriptionsService } from '../../../core/services/subscriptions.service';

type CatalogTab = 'plans' | 'features' | 'durations' | 'prices' | 'offers' | 'issuer';

@Component({
  selector: 'app-subscription-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NavbarComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private subscriptionsService = inject(SubscriptionsService);
  private translate = inject(TranslateService);

  readonly currentTab = signal<CatalogTab>('plans');

  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly features = signal<PlanFeature[]>([]);
  readonly durations = signal<PlanDuration[]>([]);
  readonly prices = signal<PlanPrice[]>([]);
  readonly offers = signal<SpecialOffer[]>([]);
  readonly issuer = signal<IssuerSettings | null>(null);

  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  // Formularios sencillos por sección
  readonly editingPlan = signal<SubscriptionPlan | null>(null);
  readonly newPlan = signal<Omit<SubscriptionPlan, 'id'> | null>(null);

  readonly editingFeature = signal<PlanFeature | null>(null);
  readonly newFeature = signal<Omit<PlanFeature, 'id'> | null>(null);

  readonly editingDuration = signal<PlanDuration | null>(null);
  readonly newDuration = signal<Omit<PlanDuration, 'id'> | null>(null);

  readonly editingPrice = signal<PlanPrice | null>(null);
  readonly newPrice = signal<PlanPrice | null>(null);

  readonly editingOffer = signal<SpecialOffer | null>(null);
  readonly newOffer = signal<Omit<SpecialOffer, 'id'> | null>(null);

  readonly issuerForm = signal<Omit<IssuerSettings, 'id'> | null>(null);

  readonly featuresByPlan = computed(() => {
    const byPlan: Record<string, PlanFeature[]> = {};
    for (const f of this.features()) {
      byPlan[f.planId] ??= [];
      byPlan[f.planId].push(f);
    }
    return byPlan;
  });

  readonly hasChangesIssuer = computed(() => !!this.issuerForm());

  ngOnInit(): void {
    this.loadAll();
  }

  changeTab(tab: CatalogTab): void {
    this.currentTab.set(tab);
    this.clearMessages();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.subscriptionsService.listPlans().subscribe({
      next: (plans) => this.plans.set(plans),
      error: (err) => this.setError(err),
    });

    this.subscriptionsService.listFeatures().subscribe({
      next: (features) => this.features.set(features),
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

    this.subscriptionsService.listOffers().subscribe({
      next: (offers) => {
        this.offers.set(offers);
        this.loading.set(false);
      },
      error: (err) => {
        this.setError(err);
        this.loading.set(false);
      },
    });

    this.subscriptionsService.getIssuerSettings().subscribe({
      next: (issuer) => {
        if (issuer) {
          this.issuer.set(issuer);
          this.issuerForm.set({
            legalName: issuer.legalName,
            taxId: issuer.taxId,
            address: issuer.address,
            email: issuer.email,
            phone: issuer.phone,
            iban: issuer.iban,
            logoUrl: issuer.logoUrl ?? null,
          });
        } else {
          this.issuer.set(null);
          this.issuerForm.set({
            legalName: '',
            taxId: '',
            address: '',
            email: '',
            phone: '',
            iban: '',
            logoUrl: null,
          });
        }
      },
      error: (err) => this.setError(err),
    });
  }

  // Helpers
  private setError(err: unknown): void {
    const message =
      err instanceof Error
        ? err.message
        : this.translate.instant('common.errors.unexpected');
    this.errorMessage.set(message);
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // PLANES
  startNewPlan(): void {
    this.clearMessages();
    this.editingPlan.set(null);
    this.newPlan.set({
      code: '',
      name: '',
      description: '',
      position: (this.plans().at(-1)?.position ?? 0) + 1,
      active: true,
    });
  }

  editPlan(plan: SubscriptionPlan): void {
    this.clearMessages();
    this.newPlan.set(null);
    this.editingPlan.set({ ...plan });
  }

  cancelPlanEdit(): void {
    this.newPlan.set(null);
    this.editingPlan.set(null);
  }

  savePlan(): void {
    const creating = this.newPlan();
    const editing = this.editingPlan();

    if (creating) {
      this.subscriptionsService.createPlan(creating).subscribe({
        next: (plan) => {
          this.plans.set([...this.plans(), plan].sort((a, b) => a.position - b.position));
          this.successMessage.set(this.translate.instant('subscriptions.catalog.planSaved'));
          this.newPlan.set(null);
        },
        error: (err) => this.setError(err),
      });
    } else if (editing) {
      this.subscriptionsService.updatePlan(editing).subscribe({
        next: (plan) => {
          this.plans.set(this.plans().map((p) => (p.id === plan.id ? plan : p)));
          this.successMessage.set(this.translate.instant('subscriptions.catalog.planSaved'));
          this.editingPlan.set(null);
        },
        error: (err) => this.setError(err),
      });
    }
  }

  deletePlan(id: string): void {
    if (!confirm(this.translate.instant('subscriptions.catalog.confirmDeletePlan'))) {
      return;
    }
    this.subscriptionsService.deletePlan(id).subscribe({
      next: () => {
        this.plans.set(this.plans().filter((p) => p.id !== id));
        this.features.set(this.features().filter((f) => f.planId !== id));
        this.prices.set(this.prices().filter((p) => p.planId !== id));
        this.offers.set(this.offers().filter((o) => o.planId !== id));
        this.successMessage.set(this.translate.instant('subscriptions.catalog.planDeleted'));
      },
      error: (err) => this.setError(err),
    });
  }

  // FEATURES
  startNewFeature(planId: string): void {
    this.clearMessages();
    this.editingFeature.set(null);
    const currentForPlan = this.features().filter((f) => f.planId === planId);
    this.newFeature.set({
      planId,
      featureText: '',
      position: (currentForPlan.at(-1)?.position ?? 0) + 1,
    });
  }

  editFeature(feature: PlanFeature): void {
    this.clearMessages();
    this.newFeature.set(null);
    this.editingFeature.set({ ...feature });
  }

  cancelFeatureEdit(): void {
    this.newFeature.set(null);
    this.editingFeature.set(null);
  }

  saveFeature(): void {
    const creating = this.newFeature();
    const editing = this.editingFeature();

    if (creating) {
      this.subscriptionsService.createFeature(creating).subscribe({
        next: (feature) => {
          this.features.set([...this.features(), feature].sort((a, b) => a.position - b.position));
          this.successMessage.set(this.translate.instant('subscriptions.catalog.featureSaved'));
          this.newFeature.set(null);
        },
        error: (err) => this.setError(err),
      });
    } else if (editing) {
      this.subscriptionsService.updateFeature(editing).subscribe({
        next: (feature) => {
          this.features.set(this.features().map((f) => (f.id === feature.id ? feature : f)));
          this.successMessage.set(this.translate.instant('subscriptions.catalog.featureSaved'));
          this.editingFeature.set(null);
        },
        error: (err) => this.setError(err),
      });
    }
  }

  deleteFeature(id: string): void {
    if (!confirm(this.translate.instant('subscriptions.catalog.confirmDeleteFeature'))) {
      return;
    }
    this.subscriptionsService.deleteFeature(id).subscribe({
      next: () => {
        this.features.set(this.features().filter((f) => f.id !== id));
        this.successMessage.set(this.translate.instant('subscriptions.catalog.featureDeleted'));
      },
      error: (err) => this.setError(err),
    });
  }

  // DURACIONES
  startNewDuration(): void {
    this.clearMessages();
    this.editingDuration.set(null);
    this.newDuration.set({
      months: 1,
      label: '',
      active: true,
    });
  }

  editDuration(duration: PlanDuration): void {
    this.clearMessages();
    this.newDuration.set(null);
    this.editingDuration.set({ ...duration });
  }

  cancelDurationEdit(): void {
    this.newDuration.set(null);
    this.editingDuration.set(null);
  }

  saveDuration(): void {
    const creating = this.newDuration();
    const editing = this.editingDuration();

    if (creating) {
      this.subscriptionsService.createDuration(creating).subscribe({
        next: (duration) => {
          this.durations.set(
            [...this.durations(), duration].sort((a, b) => a.months - b.months),
          );
          this.successMessage.set(this.translate.instant('subscriptions.catalog.durationSaved'));
          this.newDuration.set(null);
        },
        error: (err) => this.setError(err),
      });
    } else if (editing) {
      this.subscriptionsService.updateDuration(editing).subscribe({
        next: (duration) => {
          this.durations.set(
            this.durations().map((d) => (d.id === duration.id ? duration : d)),
          );
          this.successMessage.set(this.translate.instant('subscriptions.catalog.durationSaved'));
          this.editingDuration.set(null);
        },
        error: (err) => this.setError(err),
      });
    }
  }

  deleteDuration(id: string): void {
    if (!confirm(this.translate.instant('subscriptions.catalog.confirmDeleteDuration'))) {
      return;
    }
    this.subscriptionsService.deleteDuration(id).subscribe({
      next: () => {
        this.durations.set(this.durations().filter((d) => d.id !== id));
        this.prices.set(this.prices().filter((p) => p.durationId !== id));
        this.offers.set(this.offers().filter((o) => o.durationId !== id));
        this.successMessage.set(this.translate.instant('subscriptions.catalog.durationDeleted'));
      },
      error: (err) => this.setError(err),
    });
  }

  // PRECIOS
  startNewPrice(): void {
    this.clearMessages();
    if (this.plans().length === 0 || this.durations().length === 0) {
      this.errorMessage.set(this.translate.instant('subscriptions.catalog.priceRequiresPlanAndDuration'));
      return;
    }
    this.editingPrice.set(null);
    this.newPrice.set({
      planId: this.plans()[0]?.id,
      durationId: this.durations()[0]?.id,
      price: 0,
      taxRate: 21,
      active: true,
    });
  }

  editPrice(price: PlanPrice): void {
    this.clearMessages();
    this.newPrice.set(null);
    this.editingPrice.set({ ...price });
  }

  cancelPriceEdit(): void {
    this.newPrice.set(null);
    this.editingPrice.set(null);
  }

  savePrice(): void {
    const creating = this.newPrice();
    const editing = this.editingPrice();

    if (creating) {
      const exists = this.prices().some(
        (p) => p.planId === creating.planId && p.durationId === creating.durationId,
      );
      if (exists) {
        this.errorMessage.set(this.translate.instant('subscriptions.catalog.priceAlreadyExists'));
        return;
      }
      this.subscriptionsService.createPrice(creating).subscribe({
        next: (price) => {
          this.prices.set([...this.prices(), price]);
          this.successMessage.set(this.translate.instant('subscriptions.catalog.priceSaved'));
          this.newPrice.set(null);
        },
        error: (err) => this.setError(err),
      });
    } else if (editing) {
      this.subscriptionsService.updatePrice(editing).subscribe({
        next: (price) => {
          this.prices.set(
            this.prices().map((p) =>
              p.planId === price.planId && p.durationId === price.durationId ? price : p,
            ),
          );
          this.successMessage.set(this.translate.instant('subscriptions.catalog.priceSaved'));
          this.editingPrice.set(null);
        },
        error: (err) => this.setError(err),
      });
    }
  }

  deletePrice(planId: string, durationId: string): void {
    if (!confirm(this.translate.instant('subscriptions.catalog.confirmDeletePrice'))) {
      return;
    }
    this.subscriptionsService.deletePrice(planId, durationId).subscribe({
      next: () => {
        this.prices.set(
          this.prices().filter(
            (p) => !(p.planId === planId && p.durationId === durationId),
          ),
        );
        this.successMessage.set(this.translate.instant('subscriptions.catalog.priceDeleted'));
      },
      error: (err) => this.setError(err),
    });
  }

  // OFERTAS
  startNewOffer(): void {
    this.clearMessages();
    this.editingOffer.set(null);
    this.newOffer.set({
      name: '',
      planId: null,
      durationId: null,
      discountType: 'percent',
      discountValue: 0,
      validFrom: null,
      validTo: null,
      active: true,
    });
  }

  editOffer(offer: SpecialOffer): void {
    this.clearMessages();
    this.newOffer.set(null);
    this.editingOffer.set({ ...offer });
  }

  cancelOfferEdit(): void {
    this.newOffer.set(null);
    this.editingOffer.set(null);
  }

  saveOffer(): void {
    const creating = this.newOffer();
    const editing = this.editingOffer();

    if (creating) {
      this.subscriptionsService.createOffer(creating).subscribe({
        next: (offer) => {
          this.offers.set([...this.offers(), offer]);
          this.successMessage.set(this.translate.instant('subscriptions.catalog.offerSaved'));
          this.newOffer.set(null);
        },
        error: (err) => this.setError(err),
      });
    } else if (editing) {
      this.subscriptionsService.updateOffer(editing).subscribe({
        next: (offer) => {
          this.offers.set(this.offers().map((o) => (o.id === offer.id ? offer : o)));
          this.successMessage.set(this.translate.instant('subscriptions.catalog.offerSaved'));
          this.editingOffer.set(null);
        },
        error: (err) => this.setError(err),
      });
    }
  }

  deleteOffer(id: string): void {
    if (!confirm(this.translate.instant('subscriptions.catalog.confirmDeleteOffer'))) {
      return;
    }
    this.subscriptionsService.deleteOffer(id).subscribe({
      next: () => {
        this.offers.set(this.offers().filter((o) => o.id !== id));
        this.successMessage.set(this.translate.instant('subscriptions.catalog.offerDeleted'));
      },
      error: (err) => this.setError(err),
    });
  }

  // EMISOR
  saveIssuer(): void {
    const form = this.issuerForm();
    if (!form) return;

    const current = this.issuer();
    this.subscriptionsService
      .updateIssuerSettings({
        id: Boolean(current?.id),
        ...form,
      })
      .subscribe({
        next: (updated) => {
          this.issuer.set(updated);
          this.issuerForm.set({
            legalName: updated.legalName,
            taxId: updated.taxId,
            address: updated.address,
            email: updated.email,
            phone: updated.phone,
            iban: updated.iban,
            logoUrl: updated.logoUrl ?? null,
          });
          this.successMessage.set(this.translate.instant('subscriptions.catalog.issuerSaved'));
        },
        error: (err) => this.setError(err),
      });
  }

  // Utilidades
  getPlanName(planId: string | null | undefined): string {
    if (!planId) return this.translate.instant('subscriptions.catalog.anyPlan');
    const plan = this.plans().find((p) => p.id === planId);
    return plan ? `${plan.name} (${plan.code})` : planId;
  }

  getDurationLabel(durationId: string | null | undefined): string {
    if (!durationId) return this.translate.instant('subscriptions.catalog.anyDuration');
    const d = this.durations().find((x) => x.id === durationId);
    return d ? `${d.label} · ${d.months}m` : durationId;
  }
}

