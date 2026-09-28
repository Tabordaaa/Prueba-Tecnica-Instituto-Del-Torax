import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService, ViewKey } from './auth.service';

/**
 * Guard que verifica si el usuario tiene permiso para acceder a una vista.
 *
 * Si no tiene permiso, redirige a una página 404 (como si el recurso no existiera).
 * Se usa junto con authGuard en las rutas que requieren permisos específicos.
 *
 * Uso en routes.ts:
 * { path: 'users', component: Users, canActivate: [authGuard, viewGuard('users')] }
 */
export const viewGuard = (view: ViewKey): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.canView(view) ? true : router.createUrlTree(['/not-found']);
  };
};
