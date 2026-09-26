import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Inyecta en el controlador los datos del usuario autenticado,
 * que JwtStrategy deja en request.user.
 *
 * Uso: findMe(@CurrentUser() user: AuthenticatedUser)
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    return data ? user?.[data] : user;
  },
);

/** Datos que el backend guarda en request.user tras validar el token. */
export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string;
}
