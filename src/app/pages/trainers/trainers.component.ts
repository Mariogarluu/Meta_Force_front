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

/** 
 * Default fallback image URL for trainer profiles when no custom image is provided.
 * Points to a generic faun/mascot character image stored on Cloudinary.
 */
const DEFAULT_PROFILE_IMAGE_URL = 'https://res.cloudinary.com/dbzbik0zk/image/upload/v1765270536/fauno.jpg';

/**
 * Component for displaying and filtering gym trainers.
 * Allows users to view trainers by center and see their availability/activity status.
 */
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
  /** Injected UsersService for trainer data */
  usersService = inject(UsersService);
  /** Injected CentersService for center list */
  centersService = inject(CentersService);
  /** Injected AuthService for user role and preference context */
  auth = inject(AuthService);
  /** Injected TranslateService for I18n */
  translate = inject(TranslateService);

  /** Signal containing the full list of trainers */
  trainers = signal<User[]>([]);
  /** Signal containing the list of gyms/centers */
  centers = signal<Center[]>([]);
  /** Signal tracking if data is currently being fetched */
  isLoading = signal(false);
  /** Signal for displaying error messages to the user */
  errorMessage = signal<string>('');
  
  /** Signal for the currently selected center ID to filter by */
  selectedCenterId = signal<string>('');

  /** Computed signal for the currently logged-in user */
  currentUser = computed(() => this.auth.currentUser());
  /** Computed signal checking if the current user has the 'USER' role */
  isNormalUser = computed(() => this.currentUser()?.role === 'USER');

  /** 
   * Computed signal for the list of trainers after applying center filters.
   * Trainers are sorted by their active status (physically in the gym) and then by name.
   */
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

  /**
   * Initializes the component by loading trainers and centers.
   */
  ngOnInit() {
    this.loadTrainers();
    this.loadCenters();
  }

  /**
   * Fetches trainers from the backend and establishes the default center filter.
   */
  loadTrainers() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.usersService.listTrainers().subscribe({
      next: (data) => {
        // Los datos ya vienen filtrados como entrenadores activos desde el backend
        this.trainers.set(data);
        
        // Si el usuario tiene un centro favorito, seleccionarlo por defecto
        const userFavoriteCenterId = this.currentUser()?.favoriteCenterId;
        if (userFavoriteCenterId && !this.selectedCenterId()) {
          this.selectedCenterId.set(userFavoriteCenterId);
        } else if (this.centers().length > 0 && !this.selectedCenterId()) {
          // Si no tiene favorito, seleccionar el primer centro disponible
          const firstCenter = this.centers()[0];
          if (firstCenter?.id) {
            this.selectedCenterId.set(firstCenter.id);
          }
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || this.translate.instant('trainers.errors.load'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Fetches the list of training centers to populate the filter dropdown.
   */
  loadCenters() {
    // Usar listCentersWithIds para obtener todos los centros con IDs
    this.centersService.listCentersWithIds().subscribe({
      next: (data) => {
        // Filtrar solo centros que tengan ID válido
        const validCenters = data.filter(c => c.id);
        this.centers.set(validCenters);
        
        // Si no hay centro seleccionado y hay centros disponibles, seleccionar el primero
        if (!this.selectedCenterId() && validCenters.length > 0) {
          const userFavoriteCenterId = this.currentUser()?.favoriteCenterId;
          if (userFavoriteCenterId && validCenters.find(c => c.id === userFavoriteCenterId)) {
            this.selectedCenterId.set(userFavoriteCenterId);
          } else {
            const firstCenter = validCenters[0];
            if (firstCenter?.id) {
              this.selectedCenterId.set(firstCenter.id);
            }
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar centros:', error);
        const errorMsg = this.translate.instant('trainers.errors.loadCenters');
        this.errorMessage.set(errorMsg ? errorMsg : 'Error al cargar los centros');
        // Asegurar que centers esté vacío en caso de error
        this.centers.set([]);
      }
    });
  }

  /**
   * Updates the center filter when the user selects a different option.
   * @param centerId - The ID of the selected center
   */
  onCenterChange(centerId: string) {
    if (centerId) {
      this.selectedCenterId.set(centerId);
    } else if (this.centers().length > 0) {
      // Si se intenta deseleccionar, mantener el centro actual o seleccionar el primero
      const currentCenter = this.selectedCenterId();
      if (currentCenter) {
        this.selectedCenterId.set(currentCenter);
      } else {
        const firstCenter = this.centers()[0];
        if (firstCenter?.id) {
          this.selectedCenterId.set(firstCenter.id);
        }
      }
    }
  }

  /**
   * Returns the profile image URL for a trainer, defaulting to a faun image if none exists.
   * @param profileImageUrl - The trainer's specific profile image URL
   * @returns A valid image URL string
   */
  getProfileImageUrl(profileImageUrl: string | null | undefined): string {
    return profileImageUrl ? profileImageUrl : DEFAULT_PROFILE_IMAGE_URL;
  }

  /**
   * Resolves the human-readable name of a center from its ID.
   * @param centerId - The ID of the center to look up
   * @returns The name of the center or a translated placeholder
   */
  getCenterName(centerId?: string | null): string {
    if (!centerId) return this.translate.instant('trainers.noCenter');
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || this.translate.instant('trainers.centerNotFound');
  }
}


