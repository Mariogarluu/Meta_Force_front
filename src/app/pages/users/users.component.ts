import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService, UpdateUserInput } from '../../core/services/users.service';
import { CentersService } from '../../core/services/centers.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Role, UserStatus } from '../../core/models/user';
import { Center } from '../../core/models/center';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

/**
 * Users administration page component.
 * Provides functionality for searching, filtering, and managing user profiles,
 * including roles, statuses, and assigned centers.
 */
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, TranslateModule, NavbarComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  /** Injected UsersService for CRUD operations on user accounts */
  usersService = inject(UsersService);
  /** Injected CentersService for mapping users to physical gym locations */
  centersService = inject(CentersService);
  /** Injected AuthService for permission checks and current session context */
  auth = inject(AuthService);
  /** Injected TranslateService for UI multi-language support */
  translate = inject(TranslateService);

  /** Signal containing the master list of system users */
  users = signal<User[]>([]);
  /** Signal containing the list of available gym centers */
  centers = signal<Center[]>([]);
  /** Signal tracking background API activity for user list loading */
  isLoading = signal(false);
  /** Signal for displaying primary error messages in the UI */
  errorMessage = signal<string>('');
  
  /** Signal for the name/keyword filter input */
  filterName = signal<string>('');
  /** Signal for the email address filter input */
  filterEmail = signal<string>('');
  /** Signal for the role-based filter dropdown */
  filterRole = signal<Role | ''>('');
  /** Signal for the user status filter dropdown */
  filterStatus = signal<UserStatus | ''>('');
  /** Signal for the favorite center filter dropdown */
  filterCenter = signal<string>('');
  /** Signal for the starting registration date filter */
  filterDateFrom = signal<string>('');
  /** Signal for the ending registration date filter */
  filterDateTo = signal<string>('');
  /** Signal controlling the visibility of the advanced filter sidebar */
  showFilters = signal(false);
  
  /** Signal controlling the visibility of the user editing modal */
  showEditModal = signal(false);
  /** Signal controlling the visibility of the deletion confirmation overlay */
  showDeleteModal = signal(false);
  /** Signal controlling the visibility of the detailed user profile modal */
  showViewModal = signal(false);
  
  /** Signal storing the user currently being edited or targeted for deletion */
  selectedUser = signal<User | null>(null);
  /** Signal storing the user currently being viewed in full detail */
  viewUser = signal<User | null>(null);
  /** Form state object for user profile updates */
  userForm: UpdateUserInput = {
    name: '',
    email: '',
    role: 'USER',
    status: 'PENDING',
    favoriteCenterId: null
  };

  /** Immutable list of available system roles */
  readonly roles: Role[] = ['SUPERADMIN', 'ADMIN_CENTER', 'TRAINER', 'CLEANER', 'USER'];
  /** Immutable list of available user account statuses */
  readonly statuses: UserStatus[] = ['PENDING', 'ACTIVE', 'INACTIVE'];

  /** Computed signal for the currently authenticated user */
  currentUser = computed(() => this.auth.currentUser());
  /** Computed convenience flag for Super Admin permissions */
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  /** Computed convenience flag for Center Admin permissions */
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  /** Computed signal for general edit authorization */
  canEdit = computed(() => this.isSuperAdmin() || this.isAdminCenter());
  /** Computed signal for general deletion authorization */
  canDelete = computed(() => this.isSuperAdmin() || this.isAdminCenter());
  /** Computed signal for center assignment permission (restricted to Super Admins) */
  canAssignCenter = computed(() => this.isSuperAdmin());

  /** 
   * Computed signal for the filtered list of users.
   * Dynamically reacts to name, email, role, status, center, and date range filters.
   */
  filteredUsers = computed(() => {
    let filtered = this.users();
    
    if (this.filterName()) {
      const nameFilter = this.filterName().toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(nameFilter));
    }
    
    if (this.filterEmail()) {
      const emailFilter = this.filterEmail().toLowerCase();
      filtered = filtered.filter(u => u.email.toLowerCase().includes(emailFilter));
    }
    
    if (this.filterRole()) {
      filtered = filtered.filter(u => u.role === this.filterRole());
    }
    
    if (this.filterStatus()) {
      filtered = filtered.filter(u => u.status === this.filterStatus());
    }
    
    if (this.filterCenter()) {
      filtered = filtered.filter(u => 
        u.favoriteCenterId === this.filterCenter() || 
        u.favoriteCenter?.id === this.filterCenter() ||
        u.centerId === this.filterCenter() ||
        u.center?.id === this.filterCenter()
      );
    }
    
    if (this.filterDateFrom()) {
      const dateFrom = new Date(this.filterDateFrom());
      filtered = filtered.filter(u => {
        if (!u.createdAt) return false;
        return new Date(u.createdAt) >= dateFrom;
      });
    }
    
    if (this.filterDateTo()) {
      const dateTo = new Date(this.filterDateTo());
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(u => {
        if (!u.createdAt) return false;
        return new Date(u.createdAt) <= dateTo;
      });
    }
    
    return filtered;
  });

  /**
   * Component initialization. Triggers loading of users and centers.
   */
  ngOnInit() {
    this.loadUsers();
    if (this.isSuperAdmin()) {
      this.loadCenters();
    }
  }

  /**
   * Fetches the complete list of users from the backend directory.
   */
  loadUsers() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.usersService.listUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al cargar los usuarios');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Fetches the list of gym centers for filtering and assignment purposes.
   */
  loadCenters() {
    this.centersService.listCenters().subscribe({
      next: (data) => {
        this.centers.set(data);
      },
      error: (error) => {
        console.error('Error al cargar centros:', error);
      }
    });
  }

  /**
   * Fetches full detail for a user and opens the view modal.
   * @param user - Summary user entity
   */
  openViewModal(user: User) {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.usersService.getUser(user.id).subscribe({
      next: (fullUser) => {
        this.viewUser.set(fullUser);
        this.showViewModal.set(true);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.viewUser.set(user);
        this.showViewModal.set(true);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Closes the detailed user profile modal.
   */
  closeViewModal() {
    this.showViewModal.set(false);
    this.viewUser.set(null);
    this.errorMessage.set('');
  }

  /**
   * Fetches full detail for a user and opens the editing modal with form state.
   * @param user - Summary user entity
   */
  openEditModal(user: User) {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.usersService.getUser(user.id).subscribe({
      next: (fullUser) => {
        this.selectedUser.set(fullUser);
        this.userForm = {
          name: fullUser.name,
          email: fullUser.email,
          role: fullUser.role,
          status: fullUser.status || 'PENDING',
          favoriteCenterId: fullUser.favoriteCenterId || null
        };
        this.showEditModal.set(true);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al cargar el usuario');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Closes the user editing modal.
   */
  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedUser.set(null);
    this.errorMessage.set('');
  }

  /**
   * Opens the confirmation modal for user deletion.
   * @param user - Target user to delete
   */
  openDeleteModal(user: User) {
    this.selectedUser.set(user);
    this.showDeleteModal.set(true);
    this.errorMessage.set('');
  }

  /**
   * Closes the user deletion confirmation modal.
   */
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedUser.set(null);
    this.errorMessage.set('');
  }

  /**
   * Submits the updated user profile data to the backend.
   * Handles role and center assignment restrictions based on admin level.
   */
  updateUser() {
    const user = this.selectedUser();
    if (!user?.id) return;

    if (!this.userForm.name?.trim() || !this.userForm.email?.trim()) {
      this.errorMessage.set(this.translate.instant('users.errors.nameEmailRequired'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const roleChanged = this.isSuperAdmin() && this.userForm.role && this.userForm.role !== user.role;

    const updateData: UpdateUserInput = {
      name: this.userForm.name,
      email: this.userForm.email,
    };

    if (this.isSuperAdmin()) {
      updateData.favoriteCenterId = this.userForm.favoriteCenterId;
    }

    updateData.status = this.userForm.status;

    this.usersService.updateUser(user.id, updateData).subscribe({
      next: () => {
        if (!roleChanged) {
          this.isLoading.set(false);
          this.closeEditModal();
          this.loadUsers();
          return;
        }

        this.usersService.setUserRole(user.id, this.userForm.role ?? user.role).subscribe({
          next: () => {
            // Best-effort: si falla, no bloqueamos el guardado.
            this.usersService.forceLogout(user.id).subscribe({
              next: () => {
                this.isLoading.set(false);
                this.closeEditModal();
                this.loadUsers();
              },
              error: () => {
                this.isLoading.set(false);
                this.closeEditModal();
                this.loadUsers();
              },
            });
          },
          error: (error) => {
            this.errorMessage.set(error.error?.message || 'Error al actualizar el rol');
            this.isLoading.set(false);
          },
        });
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al actualizar el usuario');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Executes the deletion of the selected user account.
   */
  deleteUser() {
    const user = this.selectedUser();
    if (!user?.id) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeDeleteModal();
        this.loadUsers();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al eliminar el usuario');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Quickly transitions a user status to 'ACTIVE' (validation/approval).
   * @param user - The user entity to validate
   */
  validateUser(user: User) {
    this.usersService.updateUser(user.id, { status: 'ACTIVE' }).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al validar el usuario');
      }
    });
  }

  /**
   * Maps user status to UI color classes for the status badge.
   * @param status - User status enum value
   * @returns Tailwind CSS background color class
   */
  getStatusColor(status?: UserStatus): string {
    const colors: Record<UserStatus, string> = {
      'PENDING': 'bg-yellow-500',
      'ACTIVE': 'bg-green-500',
      'INACTIVE': 'bg-red-500'
    };
    return colors[status || 'PENDING'] || 'bg-gray-500';
  }

  /**
   * Resolves a human-readable and translated status string.
   * @param status - User status enum value
   * @returns Translated status text
   */
  getStatusText(status?: UserStatus): string {
    if (!status) return '';
    return this.getStatusName(status);
  }

  /**
   * Returns a raw SVG string representing the icon for a specific user role.
   * @param role - Role enum value
   * @returns SVG markup string
   */
  getRoleIcon(role: string): string {
    const size = 'w-5 h-5';
    switch (role) {
      case 'SUPERADMIN': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.5 12c.7-3.5-3.5-3.5-3.5-3.5S8.5 8.5 9.5 12s3.5 3.5 3.5 3.5S16.5 15.5 15.5 12zM12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /></svg>`;
      case 'ADMIN_CENTER': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M6.75 3v18M17.25 3v18M6.75 3v18M17.25 3v18M6.75 3v18M17.25 3v18" /></svg>`;
      case 'TRAINER': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-1.036-.84-1.875-1.875-1.875h-4.636V6.184c0-1.036-.84-1.875-1.875-1.875h-2.25c-1.036 0-1.875.84-1.875 1.875v.191H4.875C3.839 6.359 3 7.198 3 8.234V15.75h18V8.25z" /></svg>`;
      case 'CLEANER': 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M14.5 19.5l-5-5-5-5M12 10.5v12M12 4.5l-5 5-5 5M12 4.5l5 5 5 5M12 4.5l-5 5-5 5" /></svg>`;
      case 'USER': default: 
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${size}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`;
    }
  }

  /**
   * Resolves the translated name of a system role.
   * @param role - Role enum value
   * @returns Translated string
   */
  getRoleName(role: string): string {
    return this.translate.instant(`dashboard.roles.${role}`) || this.translate.instant('dashboard.roles.USER');
  }

  /**
   * Maps a center ID to its human-readable name.
   * @param centerId - Entity ID
   * @returns Translated center name or 'N/A'
   */
  getCenterName(centerId?: string | null): string {
    if (!centerId) return this.translate.instant('users.noCenter');
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || this.translate.instant('users.centerNotFound');
  }

  /**
   * Resolves the translated name of a user status.
   * @param status - Status key
   * @returns Translated string
   */
  getStatusName(status: string): string {
    return this.translate.instant(`users.statuses.${status}`) || status;
  }

  /**
   * Toggles the visibility of the advanced filter panel.
   */
  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  /**
   * Resets all search and date filters to their initial empty states.
   */
  clearFilters() {
    this.filterName.set('');
    this.filterEmail.set('');
    this.filterRole.set('');
    this.filterStatus.set('');
    this.filterCenter.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
  }

  /** Computed signal checking if any search criteria are currently active */
  hasActiveFilters = computed(() => {
    return !!(
      this.filterName() ||
      this.filterEmail() ||
      this.filterRole() ||
      this.filterStatus() ||
      this.filterCenter() ||
      this.filterDateFrom() ||
      this.filterDateTo()
    );
  });
}

