import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // 1. Obtención segura del token (Idealmente de un servicio, simplificado aquí)
  const token = localStorage.getItem('auth_token'); // Ojo: localStorage tiene riesgos XSS, luego veremos Cookies

  // 2. Clonado y firma de la petición
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        // Cabeceras de seguridad extra para el cliente
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 3. Manejo Centralizado de Errores de Seguridad
      
      if (error.status === 401) {
        // Token expirado o inválido: Limpieza inmediata
        localStorage.removeItem('auth_token');
        router.navigate(['/auth/login']);
      }

      if (error.status === 403) {
        // Forbidden: Usuario logueado pero sin permisos
        // No redirigir al login, mostrar mensaje de acceso denegado
        console.warn('Intento de acceso no autorizado detectado.');
      }

      // Re-lanzar el error para que el componente lo muestre (si es necesario)
      return throwError(() => error);
    })
  );
};