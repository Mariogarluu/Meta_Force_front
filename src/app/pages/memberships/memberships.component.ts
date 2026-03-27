import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembershipsService } from '../../core/services/memberships.service';
import { AuthService } from '../../core/services/auth.service';
import {
  MembershipPlan,
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
} from '../../core/models/membership';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

/**
 * Component for managing and displaying membership plans (Diets, Training, etc.).
 * Provides CRUD functionality for administrators and viewing capabilities for regular users.
 */
@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NavbarComponent],
  templateUrl: './memberships.component.html',
  styleUrl: './memberships.component.scss',
})
export class MembershipsComponent implements OnInit {
  /** Injected MembershipsService for plan operations */
  private membershipsService = inject(MembershipsService);
  /** Injected AuthService to identify administrative privileges */
  private authService = inject(AuthService);
  /** Injected TranslateService for internationalization */
  translate = inject(TranslateService);

  /** Signal containing the full list of membership plans */
  memberships = signal<MembershipPlan[]>([]);
  /** Signal tracking background activity for loading states */
  isLoading = signal(false);
  /** Signal for displaying error text to the user */
  errorMessage = signal<string>('');

  /** Signal managing the create plan modal visibility */
  showCreateModal = signal(false);
  /** Signal managing the edit plan modal visibility */
  showEditModal = signal(false);
  /** Signal managing the delete confirmation modal visibility */
  showDeleteModal = signal(false);

  /** Signal for the membership plan currently being edited or deleted */
  selectedMembership = signal<MembershipPlan | null>(null);

  /** Form state for creating or updating a membership plan */
  membershipForm: CreateMembershipPlanInput = {
    name: '',
    description: '',
    price: 0,
    duration: 1,
    features: [],
    isActive: true,
  };

  /** Temporary signal for a new feature string before adding it to the plan */
  currentFeature = signal<string>('');

  /** Computed signal for the current user session */
  currentUser = computed(() => this.authService.currentUser());
  /** Computed signal checking if user is SUPERADMIN */
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  /** Computed signal checking if user is ADMIN_CENTER */
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  /** Computed signal checking if the user can perform administrative actions */
  canManage = computed(() => this.isSuperAdmin() || this.isAdminCenter());

  /** 
   * Computed signal for the memberships visible to current user.
   * Filters out inactive plans for regular users.
   */
  displayedMemberships = computed(() => {
    if (this.canManage()) {
      return this.memberships();
    }
    return this.memberships().filter((m) => m.isActive);
  });

  /**
   * Initializes the component by loading the membership plans.
   */
  ngOnInit() {
    this.loadMemberships();
  }

  /**
   * Fetches the membership catalog from the backend.
   */
  loadMemberships() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.membershipsService.listMembershipPlans().subscribe({
      next: (data) => {
        this.memberships.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('memberships.errors.load'));
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Prepares and opens the creation modal with a blank form.
   */
  openCreateModal() {
    this.membershipForm = {
      name: '',
      description: '',
      price: 0,
      duration: 1,
      features: [],
      isActive: true,
    };
    this.currentFeature.set('');
    this.showCreateModal.set(true);
  }

  /**
   * Closes the creation modal and resets the form state.
   */
  closeCreateModal() {
    this.showCreateModal.set(false);
    this.membershipForm = {
      name: '',
      description: '',
      price: 0,
      duration: 1,
      features: [],
      isActive: true,
    };
    this.currentFeature.set('');
  }

  /**
   * Prepares and opens the edit modal for a specific plan.
   * @param membership - The membership plan to edit
   */
  openEditModal(membership: MembershipPlan) {
    this.selectedMembership.set(membership);
    this.membershipForm = {
      name: membership.name,
      description: membership.description || '',
      price: membership.price,
      duration: membership.duration,
      features: [...membership.features],
      isActive: membership.isActive,
    };
    this.currentFeature.set('');
    this.showEditModal.set(true);
  }

  /**
   * Closes the edit modal and clears the selection.
   */
  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedMembership.set(null);
    this.currentFeature.set('');
  }

  /**
   * Opens the deletion confirmation modal.
   * @param membership - The membership plan to delete
   */
  openDeleteModal(membership: MembershipPlan) {
    this.selectedMembership.set(membership);
    this.showDeleteModal.set(true);
  }

  /**
   * Closes the deletion confirmation modal and clears the selection.
   */
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedMembership.set(null);
  }

  /**
   * Adds the current feature text to the form's feature list.
   */
  addFeature() {
    const feature = this.currentFeature().trim();
    if (feature && !this.membershipForm.features?.includes(feature)) {
      this.membershipForm.features = this.membershipForm.features || [];
      this.membershipForm.features.push(feature);
      this.currentFeature.set('');
    }
  }

  /**
   * Removes a feature from the form's list by index.
   * @param index - Position of the feature in the array
   */
  removeFeature(index: number) {
    if (this.membershipForm.features) {
      this.membershipForm.features.splice(index, 1);
    }
  }

  /**
   * Submits the create form to the backend after basic validation.
   */
  createMembership() {
    if (!this.membershipForm.name || this.membershipForm.price < 0 || this.membershipForm.duration < 1) {
      this.errorMessage.set(this.translate.instant('memberships.errors.validation'));
      return;
    }

    this.isLoading.set(true);
    this.membershipsService.createMembershipPlan(this.membershipForm).subscribe({
      next: () => {
        this.loadMemberships();
        this.closeCreateModal();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('memberships.errors.create'));
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Submits updates for the selected membership plan to the backend.
   */
  updateMembership() {
    const id = this.selectedMembership()?.id;
    if (!id) return;

    if (!this.membershipForm.name || this.membershipForm.price < 0 || this.membershipForm.duration < 1) {
      this.errorMessage.set(this.translate.instant('memberships.errors.validation'));
      return;
    }

    this.isLoading.set(true);
    const updateData: UpdateMembershipPlanInput = {
      name: this.membershipForm.name,
      description: this.membershipForm.description,
      price: this.membershipForm.price,
      duration: this.membershipForm.duration,
      features: this.membershipForm.features,
      isActive: this.membershipForm.isActive,
    };

    this.membershipsService.updateMembershipPlan(id, updateData).subscribe({
      next: () => {
        this.loadMemberships();
        this.closeEditModal();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('memberships.errors.update'));
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Permanently deletes the selected membership plan from the backend.
   */
  deleteMembership() {
    const id = this.selectedMembership()?.id;
    if (!id) return;

    this.isLoading.set(true);
    this.membershipsService.deleteMembershipPlan(id).subscribe({
      next: () => {
        this.loadMemberships();
        this.closeDeleteModal();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('memberships.errors.delete'));
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Formats a numeric price into a currency string based on the current language/locale.
   * @param price - Numeric value to format
   * @returns Formatted currency string (e.g., "10,00 €")
   */
  formatPrice(price: number): string {
    const currentLang = this.translate.currentLang || 'es';
    const locale = currentLang === 'es' ? 'es-ES' : currentLang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  }

  /**
   * Returns a user-friendly duration string (e.g., "1 Mes", "2 Años").
   * @param duration - Duration in months
   * @returns Translated duration string
   */
  getDurationText(duration: number): string {
    const params = { count: duration };
    if (duration === 1) {
      return this.translate.instant('memberships.month');
    }
    if (duration < 12) {
      return this.translate.instant('memberships.months', params);
    }
    const years = Math.floor(duration / 12);
    if (years === 1) {
      return this.translate.instant('memberships.year');
    }
    return this.translate.instant('memberships.years', { count: years });
  }
}


