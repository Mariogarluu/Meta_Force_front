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

  getProfileImageUrl(profileImageUrl: string | null | undefined): string {
    return profileImageUrl ? profileImageUrl : DEFAULT_PROFILE_IMAGE_URL;
  }

  getCenterName(centerId?: string | null): string {
    if (!centerId) return this.translate.instant('trainers.noCenter');
    const center = this.centers().find(c => c.id === centerId);
    return center?.name || this.translate.instant('trainers.centerNotFound');
  }
}

