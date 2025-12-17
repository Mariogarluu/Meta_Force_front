import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../core/services/users.service';
import { CentersService } from '../../core/services/centers.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { Center } from '../../core/models/center';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

const DEFAULT_PROFILE_IMAGE_URL = 'https://res.cloudinary.com/dbzbik0zk/image/upload/v1765270536/fauno.jpg';

@Component({
  selector: 'app-trainers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NavbarComponent
  ],
  templateUrl: './trainers.component.html',
  styleUrl: './trainers.component.scss'
})
export class TrainersComponent implements OnInit {
  usersService = inject(UsersService);
  centersService = inject(CentersService);
  auth = inject(AuthService);
  translate = inject(TranslateService);

  trainers = signal<User[]>([]);
  centers = signal<Center[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string>('');
  
  // Centro seleccionado para filtrar
  selectedCenterId = signal<string>('');

  currentUser = computed(() => this.auth.currentUser());
  isNormalUser = computed(() => this.currentUser()?.role === 'USER');

  // Entrenadores filtrados y ordenados
  filteredTrainers = computed(() => {
    let filtered = this.trainers();
    const centerId = this.selectedCenterId();

    // Filtrar por centro seleccionado usando favoriteCenterId del entrenador (centro donde trabaja)
    if (centerId) {
      filtered = filtered.filter(trainer => 
        trainer.favoriteCenterId === centerId ||
        trainer.favoriteCenter?.id === centerId
      );
    }

    // Ordenar: primero los que tienen centerId activo (están en el gimnasio), luego por nombre
    filtered.sort((a, b) => {
      // Primero: los que tienen centerId activo (están físicamente en el centro)
      const aIsActive = !!(a.centerId || a.center?.id);
      const bIsActive = !!(b.centerId || b.center?.id);
      
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
      // Si ambos tienen el mismo estado de actividad, ordenar por nombre
      return a.name.localeCompare(b.name);
    });

    return filtered;
  });

  ngOnInit() {
    this.loadTrainers();
    this.loadCenters();
  }

  loadTrainers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.usersService.listTrainers().subscribe({
      next: (data) => {
        this.trainers.set(data);
        
        // Set default center selection if not already set
        if (!this.selectedCenterId()) {
          this.setDefaultCenter();
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        const errorMsg = error.error?.message || this.translate.instant('trainers.errors.load');
        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  loadCenters(): void {
    this.centersService.listCentersWithIds().subscribe({
      next: (data) => {
        const validCenters = data.filter(c => c.id);
        this.centers.set(validCenters);
        
        if (!this.selectedCenterId() && validCenters.length > 0) {
          this.setDefaultCenter();
        }
      },
      error: (error) => {
        console.error('Error loading centers:', error);
        const errorMsg = this.translate.instant('trainers.errors.loadCenters');
        this.errorMessage.set(errorMsg || 'Error loading centers');
        this.centers.set([]);
      }
    });
  }

  private setDefaultCenter(): void {
    const userFavoriteCenterId = this.currentUser()?.favoriteCenterId;
    const centers = this.centers();
    
    if (userFavoriteCenterId && centers.find(c => c.id === userFavoriteCenterId)) {
      this.selectedCenterId.set(userFavoriteCenterId);
    } else if (centers.length > 0 && centers[0]?.id) {
      this.selectedCenterId.set(centers[0].id);
    }
  }

  onCenterChange(centerId: string): void {
    if (centerId) {
      this.selectedCenterId.set(centerId);
    } else {
      // Prevent deselection - keep current or set first available
      this.setDefaultCenter();
    }
  }

  getProfileImageUrl(profileImageUrl: string | null | undefined): string {
    return profileImageUrl ? profileImageUrl : DEFAULT_PROFILE_IMAGE_URL;
  }

  getCenterName(centerId?: string | null): string {
    if (!centerId) return this.translate.instant('trainers.noCenter');
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || this.translate.instant('trainers.centerNotFound');
  }
}

