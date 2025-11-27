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

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, ThemeToggleComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  usersService = inject(UsersService);
  centersService = inject(CentersService);
  auth = inject(AuthService);

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
    centerId: null
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
          centerId: fullUser.centerId || null
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
      this.errorMessage.set('El nombre y el email son obligatorios');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const updateData: UpdateUserInput = {
      name: this.userForm.name,
      email: this.userForm.email,
    };

    // Solo SUPERADMIN puede cambiar rol y asignar centro
    if (this.isSuperAdmin()) {
      updateData.role = this.userForm.role;
      updateData.centerId = this.userForm.centerId;
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
    const texts: Record<UserStatus, string> = {
      'PENDING': 'Pendiente',
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo'
    };
    return texts[status || 'PENDING'] || 'Desconocido';
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      'SUPERADMIN': '👑',
      'ADMIN_CENTER': '🏢',
      'TRAINER': '💪',
      'CLEANER': '🧹',
      'USER': '👤'
    };
    return icons[role] || '👤';
  }

  getRoleName(role: string): string {
    const names: Record<string, string> = {
      'SUPERADMIN': 'Super Administrador',
      'ADMIN_CENTER': 'Administrador de Centro',
      'TRAINER': 'Entrenador',
      'CLEANER': 'Personal de Limpieza',
      'USER': 'Usuario'
    };
    return names[role] || 'Usuario';
  }

  getCenterName(centerId?: string | null): string {
    if (!centerId) return 'Sin centro';
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || 'Centro no encontrado';
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

