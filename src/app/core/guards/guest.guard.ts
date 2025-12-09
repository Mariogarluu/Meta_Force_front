import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Guard de ruta que protege rutas de invitados (login, register).
 * Verifica que NO exista un usuario autenticado antes de permitir el acceso.
 * Si el usuario ya está autenticado, redirige al dashboard.
 * Retorna true si el usuario NO está autenticado, false en caso contrario.
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.initialLoadComplete.pipe(
    take(1),
    map(() => {
      const isAuthenticated = auth.currentUser() != null;

      if (isAuthenticated) {
        router.navigate(['/dashboard']);
        return false;
      }
      
      return true;
    })
  );
};

