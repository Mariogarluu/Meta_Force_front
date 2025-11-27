import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de ruta que protege rutas requiriendo autenticación.
 * Verifica que exista un usuario autenticado antes de permitir el acceso.
 * Si el usuario no está autenticado, redirige al login guardando la URL original para redirigir después.
 * Retorna true si el usuario está autenticado, false en caso contrario.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const isAuthenticated = auth.currentUser() != null;

  if (!isAuthenticated) {
    router.navigate(['/login'], { state: { navigateTo: state.url } });
    return false;
  }
  
  return true;
};