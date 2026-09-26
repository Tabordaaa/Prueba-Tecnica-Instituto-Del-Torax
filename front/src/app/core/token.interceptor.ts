import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { API_URL } from './api';
import { AuthService } from './auth.service';

/**
 * Agrega el header Authorization: Bearer <token> a todas las peticiones
 * dirigidas a la API, para que el backend (JwtAuthGuard) acepte la peticion.
 */
export const tokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).token;

  if (token && request.url.startsWith(API_URL)) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(request);
};
