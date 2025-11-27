import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor HTTP que agrega automáticamente el token JWT a todas las peticiones HTTP.
 * Obtiene el token del localStorage y lo añade como header Authorization Bearer.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt_token');
  
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  
  return next(req);
};

