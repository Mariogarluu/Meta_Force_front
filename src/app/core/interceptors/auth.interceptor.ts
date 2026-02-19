import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // 1. Obtención segura del token
  const token = localStorage.getItem('auth_token');

  // 2. Clonado y firma de la petición
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 3. Manejo Centralizado de Errores

      if (error.status === 401) {
        localStorage.removeItem('auth_token');
        router.navigate(['/auth/login']);
      }

      if (error.status === 403) {
        console.warn('Intento de acceso no autorizado detectado.');
      }

      return throwError(() => error);
    })
  );
};