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

@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NavbarComponent],
  templateUrl: './memberships.component.html',
  styleUrl: './memberships.component.scss',
})
export class MembershipsComponent implements OnInit {
  private membershipsService = inject(MembershipsService);
  private authService = inject(AuthService);
  translate = inject(TranslateService);

  memberships = signal<MembershipPlan[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  // Modal states
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);

  selectedMembership = signal<MembershipPlan | null>(null);

  membershipForm: CreateMembershipPlanInput = {
    name: '',
    description: '',
    price: 0,
    duration: 1,
    features: [],
    isActive: true,
  };

  currentFeature = signal<string>('');

  currentUser = computed(() => this.authService.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  canManage = computed(() => this.isSuperAdmin() || this.isAdminCenter());

  // Solo mostrar planes activos para usuarios normales
  displayedMemberships = computed(() => {
    if (this.canManage()) {
      return this.memberships();
    }
    return this.memberships().filter((m) => m.isActive);
  });

  ngOnInit() {
    this.loadMemberships();
  }

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

  // Modal Management
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

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedMembership.set(null);
    this.currentFeature.set('');
  }

  openDeleteModal(membership: MembershipPlan) {
    this.selectedMembership.set(membership);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedMembership.set(null);
  }

  // Feature Management
  addFeature() {
    const feature = this.currentFeature().trim();
    if (feature && !this.membershipForm.features?.includes(feature)) {
      this.membershipForm.features = this.membershipForm.features || [];
      this.membershipForm.features.push(feature);
      this.currentFeature.set('');
    }
  }

  removeFeature(index: number) {
    if (this.membershipForm.features) {
      this.membershipForm.features.splice(index, 1);
    }
  }

  // CRUD Operations
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

  formatPrice(price: number): string {
    const currentLang = this.translate.currentLang || 'es';
    const locale = currentLang === 'es' ? 'es-ES' : currentLang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  }

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

