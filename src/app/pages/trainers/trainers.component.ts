import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../core/services/users.service';
import { CentersService } from '../../core/services/centers.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { Center } from '../../core/models/center';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

const DEFAULT_PROFILE_IMAGE_URL = 'https://res.cloudinary.com/dbzbik0zk/image/upload/v1765270536/fauno.jpg';

@Component({
  selector: 'app-trainers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ThemeToggleComponent,
    TranslateModule,
    LanguageSelectorComponent,
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

    // Filtrar por centro seleccionado usando solo favoriteCenterId del entrenador
    if (centerId) {
      filtered = filtered.filter(trainer => 
        trainer.favoriteCenterId === centerId ||
        trainer.favoriteCenter?.id === centerId
      );
    }

    // Ordenar: primero los del centro favorito del usuario, luego el resto
    const userFavoriteCenterId = this.currentUser()?.favoriteCenterId;
    if (userFavoriteCenterId) {
      filtered.sort((a, b) => {
        const aIsFavorite = a.favoriteCenterId === userFavoriteCenterId || 
                           a.favoriteCenter?.id === userFavoriteCenterId;
        const bIsFavorite = b.favoriteCenterId === userFavoriteCenterId || 
                           b.favoriteCenter?.id === userFavoriteCenterId;
        
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return 0;
      });
    }

    return filtered;
  });

  ngOnInit() {
    this.loadTrainers();
    this.loadCenters();
  }

  loadTrainers() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.usersService.listUsers().subscribe({
      next: (data) => {
        // Filtrar solo entrenadores activos
        const trainers = data.filter(user => 
          user.role === 'TRAINER' && user.status === 'ACTIVE'
        );
        this.trainers.set(trainers);
        
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
    this.centersService.listCenters().subscribe({
      next: (data) => {
        this.centers.set(data);
        
        // Si no hay centro seleccionado y hay centros disponibles, seleccionar el primero
        if (!this.selectedCenterId() && data.length > 0) {
          const userFavoriteCenterId = this.currentUser()?.favoriteCenterId;
          if (userFavoriteCenterId && data.find(c => c.id === userFavoriteCenterId)) {
            this.selectedCenterId.set(userFavoriteCenterId);
          } else {
            const firstCenter = data[0];
            if (firstCenter?.id) {
              this.selectedCenterId.set(firstCenter.id);
            }
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar centros:', error);
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

