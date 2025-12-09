import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators'; // Importar map y take

/**
 * Guard de ruta que protege rutas requiriendo autenticación.
 * Verifica que exista un usuario autenticado antes de permitir el acceso.
 * Si el usuario no está autenticado, redirige al login guardando la URL original para redirigir después.
 * Retorna true si el usuario está autenticado, false en caso contrario.
 * * MODIFICACIÓN: Espera a que la carga inicial del AuthService termine para evitar el bug de recarga (F5).
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);


  return auth.initialLoadComplete.pipe( 
    take(1), 
    map(() => {
      const isAuthenticated = auth.currentUser() != null;

      if (!isAuthenticated) {
        router.navigate(['/login'], { state: { navigateTo: state.url } });
        return false;
      }
      
      return true;
    })
  );
};