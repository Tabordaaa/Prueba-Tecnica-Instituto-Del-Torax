import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como publica, es decir, accesible sin token JWT.
 *
 * Por defecto TODAS las rutas requieren token ( JwtAuthGuard esta registrado
 * de forma global). Con @Public() se abren las excepciones: login, registro, etc.
 *
 * Uso: @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
