import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService, ViewKey } from './auth.service';

/**
 * Protege las rutas privadas: si no hay sesion iniciada,
 * el usuario es enviado al login.
 *
 * Si el usuario tiene un token guardado pero este ya no es valido (expirado o invalido),
 * se redirige a 404 en lugar de login, como si el recurso no existiera.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si hay usuario en memoria, la sesion es valida
  if (authService.isLoggedIn()) {
    return true;
  }

  // Si hay token guardado pero el usuario no esta en memoria,
  // significa que el token expiro o es invalido -> 404
  if (authService.token) {
    authService.logout();
    return router.createUrlTree(['/not-found']);
  }

  // No hay sesion -> login
  return router.createUrlTree(['/login']);
};

/**
 * Guard combinado que verifica autenticacion Y permisos por rol.
 *
 * - Sin sesion -> login
 * - Token expirado -> 404
 * - Sin permiso para la vista -> 404
 * - Con sesion y permiso -> permite acceso
 *
 * Uso en routes.ts:
 * { path: 'users', component: Users, canActivate: [permissionGuard('users')] }
 */
export const permissionGuard = (view: ViewKey): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('[permissionGuard] Vista:', view);
    console.log('[permissionGuard] Usuario:', authService.user());
    console.log('[permissionGuard] isLoggedIn:', authService.isLoggedIn());
    console.log('[permissionGuard] canView:', authService.canView(view));

    // No hay sesion -> login
    if (!authService.isLoggedIn()) {
      // Si hay token pero no usuario, el token expiro -> 404
      if (authService.token) {
        console.log('[permissionGuard] Token expirado, redirigiendo a 404');
        authService.logout();
        return router.createUrlTree(['/not-found']);
      }
      console.log('[permissionGuard] No hay sesion, redirigiendo a login');
      return router.createUrlTree(['/login']);
    }

    // Hay sesion pero no tiene permiso para esta vista -> 404
    if (!authService.canView(view)) {
      console.log('[permissionGuard] Sin permiso, redirigiendo a 404');
      return router.createUrlTree(['/not-found']);
    }

    // Con sesion y permiso -> permite acceso
    console.log('[permissionGuard] Acceso permitido');
    return true;
  };
};
