import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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