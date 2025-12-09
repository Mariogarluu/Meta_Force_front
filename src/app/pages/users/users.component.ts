import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService, UpdateUserInput } from '../../core/services/users.service';
import { CentersService } from '../../core/services/centers.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Role, UserStatus } from '../../core/models/user';
import { Center } from '../../core/models/center';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, ThemeToggleComponent, TranslateModule, LanguageSelectorComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  usersService = inject(UsersService);
  centersService = inject(CentersService);
  auth = inject(AuthService);
  translate = inject(TranslateService);

  users = signal<User[]>([]);
  centers = signal<Center[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');
  
  // Filters
  filterName = signal<string>('');
  filterEmail = signal<string>('');
  filterRole = signal<Role | ''>('');
  filterStatus = signal<UserStatus | ''>('');
  filterCenter = signal<string>('');
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');
  showFilters = signal(false);
  
  // Modal states
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showViewModal = signal(false);
  
  selectedUser = signal<User | null>(null);
  viewUser = signal<User | null>(null);
  userForm: UpdateUserInput = {
    name: '',
    email: '',
    role: 'USER',
    status: 'PENDING',
    favoriteCenterId: null
  };

  readonly roles: Role[] = ['SUPERADMIN', 'ADMIN_CENTER', 'TRAINER', 'CLEANER', 'USER'];
  readonly statuses: UserStatus[] = ['PENDING', 'ACTIVE', 'INACTIVE'];

  currentUser = computed(() => this.auth.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === 'SUPERADMIN');
  isAdminCenter = computed(() => this.currentUser()?.role === 'ADMIN_CENTER');
  canEdit = computed(() => this.isSuperAdmin() || this.isAdminCenter());
  canDelete = computed(() => this.isSuperAdmin() || this.isAdminCenter());
  canAssignCenter = computed(() => this.isSuperAdmin());

  // Filtered users
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
      dateTo.setHours(23, 59, 59, 999); // Incluir todo el día
      filtered = filtered.filter(u => {
        if (!u.createdAt) return false;
        return new Date(u.createdAt) <= dateTo;
      });
    }
    
    return filtered;
  });

  ngOnInit() {
    this.loadUsers();
    if (this.isSuperAdmin()) {
      this.loadCenters();
    }
  }

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

  closeViewModal() {
    this.showViewModal.set(false);
    this.viewUser.set(null);
    this.errorMessage.set('');
  }

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

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedUser.set(null);
    this.errorMessage.set('');
  }

  openDeleteModal(user: User) {
    this.selectedUser.set(user);
    this.showDeleteModal.set(true);
    this.errorMessage.set('');
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedUser.set(null);
    this.errorMessage.set('');
  }

  updateUser() {
    const user = this.selectedUser();
    if (!user?.id) return;

    if (!this.userForm.name?.trim() || !this.userForm.email?.trim()) {
      this.errorMessage.set(this.translate.instant('users.errors.nameEmailRequired'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const updateData: UpdateUserInput = {
      name: this.userForm.name,
      email: this.userForm.email,
    };

    // Solo SUPERADMIN puede cambiar rol y asignar centro favorito
    if (this.isSuperAdmin()) {
      updateData.role = this.userForm.role;
      updateData.favoriteCenterId = this.userForm.favoriteCenterId;
    }

    // Ambos pueden cambiar el status
    updateData.status = this.userForm.status;

    this.usersService.updateUser(user.id, updateData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeEditModal();
        this.loadUsers();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al actualizar el usuario');
        this.isLoading.set(false);
      }
    });
  }

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

  getStatusColor(status?: UserStatus): string {
    const colors: Record<UserStatus, string> = {
      'PENDING': 'bg-yellow-500',
      'ACTIVE': 'bg-green-500',
      'INACTIVE': 'bg-red-500'
    };
    return colors[status || 'PENDING'] || 'bg-gray-500';
  }

  getStatusText(status?: UserStatus): string {
    if (!status) return '';
    return this.getStatusName(status);
    const texts: Record<UserStatus, string> = {
      'PENDING': 'Pendiente',
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo'
    };
    return texts[status || 'PENDING'] || 'Desconocido';
  }

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

  getRoleName(role: string): string {
    return this.translate.instant(`dashboard.roles.${role}`) || this.translate.instant('dashboard.roles.USER');
  }

  getCenterName(centerId?: string | null): string {
    if (!centerId) return this.translate.instant('users.noCenter');
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || this.translate.instant('users.centerNotFound');
  }

  getStatusName(status: string): string {
    return this.translate.instant(`users.statuses.${status}`) || status;
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters() {
    this.filterName.set('');
    this.filterEmail.set('');
    this.filterRole.set('');
    this.filterStatus.set('');
    this.filterCenter.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
  }

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

