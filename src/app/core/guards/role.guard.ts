import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Factory function que crea un guard de ruta basado en roles.
 * Protege rutas requiriendo que el usuario autenticado tenga uno de los roles permitidos.
 * Si el usuario no está autenticado, redirige al login.
 * Si el usuario no tiene un rol permitido, redirige al dashboard.
 * Retorna un CanActivateFn configurado con los roles permitidos.
 */
export const roleGuard = (...allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    
    const user = auth.currentUser();
    
    if (!user) {
      router.navigate(['/login'], { state: { navigateTo: state.url } });
      return false;
    }

    if (!allowedRoles.includes(user.role)) {
      router.navigate(['/dashboard']);
      return false;
    }
    
    return true;
  };
};

