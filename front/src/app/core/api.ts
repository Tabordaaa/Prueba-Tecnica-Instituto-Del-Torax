import { HttpErrorResponse } from '@angular/common/http';

/**
 * URL de la API. El back (NestJS) corre en el puerto 3000 y ya tiene
 * CORS habilitado, por eso se puede llamar directo desde el navegador.
 * En desarrollo se cambia por el proxy de Angular si se desea.
 */
export const API_URL = 'http://localhost:3000/api';

/** Usuario tal como lo devuelve el back (nunca incluye password). */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'query';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Respuesta del login: el token y los datos del usuario. */
export interface LoginResponse {
  accessToken: string;
  user: User;
}

/**
 * Extrae el mensaje de error que devuelve el back.
 * NestJS puede responder "message" como string (UnauthorizedException)
 * o como arreglo de strings (errores de validacion de class-validator).
 */
export function getErrorMessage(error: unknown): string {
  // El cuerpo de la respuesta viene en response.error
  const body = (error as HttpErrorResponse)?.error;

  if (Array.isArray(body?.message)) {
    return body.message.join(' | ');
  }

  return body?.message ?? 'Ocurrio un error inesperado';
}
