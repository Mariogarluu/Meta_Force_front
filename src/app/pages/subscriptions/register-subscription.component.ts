import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SubscriptionsService } from '../../core/services/subscriptions.service';
import {
  SubscriptionPlan,
  PlanDuration,
  PlanPrice,
  SpecialOffer,
  UserLite,
  RegisterSubscriptionResponse,
} from '../../core/models/subscription';

@Component({
  selector: 'app-register-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NavbarComponent],
  templateUrl: './register-subscription.component.html',
  styleUrl: './register-subscription.component.scss',
})
export class RegisterSubscriptionComponent implements OnInit {
  private subscriptionsService = inject(SubscriptionsService);
  private translate = inject(TranslateService);

  // Catálogo
  plans = signal<SubscriptionPlan[]>([]);
  durations = signal<PlanDuration[]>([]);
  prices = signal<PlanPrice[]>([]);
  offers = signal<SpecialOffer[]>([]);

  // Búsqueda de usuario
  searchQuery = signal<string>('');
  searchResults = signal<UserLite[]>([]);
  selectedUser = signal<UserLite | null>(null);

  // Selección de plan
  selectedPlanId = signal<string | null>(null);
  selectedDurationId = signal<string | null>(null);
  selectedOfferId = signal<string | null>(null);

  // Estados de UI
  isLoadingCatalog = signal(false);
  isSearchingUser = signal(false);
  isSubmitting = signal(false);
  isRetryingEmail = signal(false);
  isRegeneratingPdf = signal(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  lastInvoiceId = signal<string | null>(null);
  lastSubscriptionId = signal<string | null>(null);

  // Derivados
  availableDurations = computed(() => {
    const planId = this.selectedPlanId();
    if (!planId) return [];
    const priceForPlan = this.prices()
      .filter(p => p.planId === planId)
      .map(p => p.durationId);
    const allowedIds = new Set(priceForPlan);
    return this.durations().filter(d => allowedIds.has(d.id));
  });

  availableOffers = computed(() => {
    const planId = this.selectedPlanId();
    const durationId = this.selectedDurationId();
    return this.offers().filter(o => {
      if (!o.active) return false;
      const matchPlan = !o.planId || o.planId === planId;
      const matchDuration = !o.durationId || o.durationId === durationId;
      return matchPlan && matchDuration;
    });
  });

  constructor() {}

  ngOnInit(): void {
    this.loadCatalog();
    this.searchUsers(); // Carga usuarios predeterminados
  }

  private loadCatalog(): void {
    this.isLoadingCatalog.set(true);
    this.errorMessage.set('');

    // Cargamos en paralelo usando subscribe anidados simples
    this.subscriptionsService.listPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar los planes');
      },
    });

    this.subscriptionsService.listDurations().subscribe({
      next: (durations) => {
        this.durations.set(durations);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar duraciones');
      },
    });

    this.subscriptionsService.listPrices().subscribe({
      next: (prices) => {
        this.prices.set(prices);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar precios');
      },
    });

    this.subscriptionsService.listOffers().subscribe({
      next: (offers) => {
        this.offers.set(offers);
        this.isLoadingCatalog.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar ofertas');
        this.isLoadingCatalog.set(false);
      },
    });
  }

  // Paso 1: búsqueda
  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.searchUsers(); // Búsqueda en tiempo real con cada tecla pulsada
  }

  searchUsers(): void {
    const query = this.searchQuery().trim();
    this.isSearchingUser.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.subscriptionsService.searchUsers(query).subscribe({
      next: (users) => {
        this.searchResults.set(users);
        this.selectedUser.set(users[0] ?? null);
        if (users.length === 0 && query) {
          this.errorMessage.set(this.translate.instant('subscriptions.errors.noUsers'));
        }
        this.isSearchingUser.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || this.translate.instant('subscriptions.errors.searchFailed'));
        this.isSearchingUser.set(false);
      },
    });
  }

  selectUser(user: UserLite): void {
    this.selectedUser.set(user);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  // Paso 2: selección plan/duración/oferta
  selectPlan(planId: string): void {
    this.selectedPlanId.set(planId);
    this.selectedDurationId.set(null);
    this.selectedOfferId.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  selectDuration(durationId: string): void {
    this.selectedDurationId.set(durationId);
    this.selectedOfferId.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  selectOffer(offerId: string | null): void {
    this.selectedOfferId.set(offerId);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  // Paso 3: resumen + confirmación
  getSelectedPlan(): SubscriptionPlan | undefined {
    const id = this.selectedPlanId();
    return this.plans().find(p => p.id === id);
  }

  getSelectedDuration(): PlanDuration | undefined {
    const id = this.selectedDurationId();
    return this.durations().find(d => d.id === id);
  }

  getSelectedOffer(): SpecialOffer | undefined {
    const id = this.selectedOfferId();
    return this.offers().find(o => o.id === id);
  }

  getSelectedPrice(): PlanPrice | undefined {
    const planId = this.selectedPlanId();
    const durationId = this.selectedDurationId();
    return this.prices().find(p => p.planId === planId && p.durationId === durationId);
  }

  confirmSubscription(): void {
    const user = this.selectedUser();
    const planId = this.selectedPlanId();
    const durationId = this.selectedDurationId();

    if (!user || !planId || !durationId) {
      this.errorMessage.set(this.translate.instant('subscriptions.errors.missingSelection'));
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.lastInvoiceId.set(null);
    this.lastSubscriptionId.set(null);

    this.subscriptionsService
      .registerSubscription({
        userId: user.id,
        planId,
        durationId,
        offerId: this.selectedOfferId(),
      })
      .subscribe({
        next: (res: RegisterSubscriptionResponse) => {
          this.isSubmitting.set(false);
          this.lastInvoiceId.set(res.invoice_id);
          this.lastSubscriptionId.set(res.subscription_id);
          this.successMessage.set(this.translate.instant('subscriptions.success.registered'));
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(error.message || this.translate.instant('subscriptions.errors.registerFailed'));
        },
      });
  }

  resendEmail(): void {
    const subscriptionId = this.lastSubscriptionId();
    if (!subscriptionId) {
      return;
    }
    this.isRetryingEmail.set(true);
    this.errorMessage.set('');

    this.subscriptionsService.resendSubscriptionEmail(subscriptionId).subscribe({
      next: () => {
        this.isRetryingEmail.set(false);
        this.successMessage.set(this.translate.instant('subscriptions.success.emailResent'));
      },
      error: (error) => {
        this.isRetryingEmail.set(false);
        this.errorMessage.set(error.message || this.translate.instant('subscriptions.errors.emailResendFailed'));
      },
    });
  }

  regeneratePdf(): void {
    const invoiceId = this.lastInvoiceId();
    if (!invoiceId) {
      return;
    }
    this.isRegeneratingPdf.set(true);
    this.errorMessage.set('');

    this.subscriptionsService.regenerateInvoicePdf(invoiceId).subscribe({
      next: () => {
        this.isRegeneratingPdf.set(false);
        this.successMessage.set(this.translate.instant('subscriptions.success.pdfRegenerated'));
      },
      error: (error) => {
        this.isRegeneratingPdf.set(false);
        this.errorMessage.set(error.message || this.translate.instant('subscriptions.errors.pdfRegenerateFailed'));
      },
    });
  }

  formatPrice(value: number): string {
    const lang = this.translate.currentLang || 'es';
    const locale = lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  getProfileImageUrl(profileImageUrl: string | null | undefined): string {
    return profileImageUrl ? profileImageUrl : 'https://res.cloudinary.com/dbzbik0zk/image/upload/v1765270536/fauno.jpg';
  }

  calculateTotalPrice(): number {
    const priceObj = this.getSelectedPrice();
    if (!priceObj) return 0;
    const base = priceObj.price;
    const offer = this.getSelectedOffer();
    if (!offer) return base;
    if (offer.discountType === 'percent') {
      return Math.max(0, base * (1 - offer.discountValue / 100));
    } else if (offer.discountType === 'amount') {
      return Math.max(0, base - offer.discountValue);
    }
    return base;
  }
}

