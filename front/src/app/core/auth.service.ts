import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_URL, LoginResponse, User } from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/** Vistas disponibles en el sistema. */
export type ViewKey =
  | 'dashboard'
  | 'users'
  | 'upload'
  | 'history'
  | 'records'
  | 'errors'
  | 'reports';

/** Permisos por rol: que vistas puede ver cada rol. */
const ROLE_PERMISSIONS: Record<string, ViewKey[]> = {
  admin: ['dashboard', 'users', 'upload', 'history', 'records', 'errors', 'reports'],
  operator: ['dashboard', 'upload', 'history', 'records', 'errors', 'reports'],
  query: ['dashboard', 'records', 'errors', 'reports'],
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /**
   * Usuario de la sesion actual.
   * Se inicializa con lo guardado en localStorage para no perder la sesion
   * al recargar la pagina.
   *
   * Se valida la sesion al cargar: si el token expiro o los datos estan corruptos,
   * se limpia automaticamente el localStorage.
   */
  readonly user = signal<User | null>(this.validateAndReadSession());

  /** Derivada booleana para usar en el template. */
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly isOperator = computed(() => this.user()?.role === 'operator');
  readonly isQuery = computed(() => this.user()?.role === 'query');

  /** Vistas a las que el usuario actual tiene acceso. */
  readonly allowedViews = computed<ViewKey[]>(() => {
    const role = this.user()?.role;
    return role ? (ROLE_PERMISSIONS[role] ?? []) : [];
  });

  /** Verifica si el usuario actual puede acceder a una vista. */
  canView(view: ViewKey): boolean {
    return this.allowedViews().includes(view);
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, credentials)
      .pipe(tap((response) => this.saveSession(response)));
  }

  register(data: { name: string; email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${API_URL}/auth/register`, data);
  }

  /** Cierra sesion: borra el token y vuelve al login. */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  /** Token guardado, lo usa el interceptor para mandar el header Authorization. */
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private saveSession({ accessToken, user }: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.user.set(user);
  }

  private readStoredUser(): User | null {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  }

  /**
   * Valida la sesion guardada en localStorage.
   *
   * Verifica que:
   * 1. El token exista y no haya expirado
   * 2. El usuario exista y tenga los campos requeridos
   * 3. El rol del usuario sea valido
   *
   * Si algo falla, limpia el localStorage automaticamente.
   */
  private validateAndReadSession(): User | null {
    const token = this.token;
    const storedUser = localStorage.getItem(USER_KEY);

    console.log('[AuthService] Validando sesion...');
    console.log('[AuthService] Token:', token ? 'existe' : 'no existe');
    console.log('[AuthService] Usuario:', storedUser ? 'existe' : 'no existe');

    // No hay token ni usuario -> no hay sesion
    if (!token && !storedUser) {
      console.log('[AuthService] No hay sesion');
      return null;
    }

    // Hay token o usuario pero no ambos -> datos inconsistentes, limpiar
    if (!token || !storedUser) {
      console.warn('[AuthService] Sesion inconsistente, limpiando localStorage');
      this.clearStorage();
      return null;
    }

    // Verificar que el token no haya expirado
    if (this.isTokenExpired(token)) {
      console.warn('[AuthService] Token expirado, limpiando localStorage');
      this.clearStorage();
      return null;
    }

    // Verificar que el usuario tenga los campos requeridos
    try {
      const user = JSON.parse(storedUser) as User;
      console.log('[AuthService] Usuario parseado:', user);

      if (!this.isValidUser(user)) {
        console.warn('[AuthService] Usuario invalido, limpiando localStorage');
        this.clearStorage();
        return null;
      }

      console.log('[AuthService] Sesion valida');
      return user;
    } catch (error) {
      console.warn('[AuthService] Error al parsear usuario, limpiando localStorage', error);
      this.clearStorage();
      return null;
    }
  }

  /** Verifica si el token JWT ha expirado. */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;

      if (!exp) {
        return true; // Si no tiene expiracion, considerar expirado
      }

      // Si la expiracion ya paso, el token esta expirado
      return Date.now() >= exp * 1000;
    } catch {
      return true; // Si no se puede parsear, considerar expirado
    }
  }

  /** Verifica que el usuario tenga los campos requeridos y validos. */
  private isValidUser(user: User): boolean {
    // Campos requeridos
    if (!user.id || !user.name || !user.email || !user.role) {
      return false;
    }

    // Rol valido
    const validRoles = ['admin', 'operator', 'query'];
    if (!validRoles.includes(user.role)) {
      return false;
    }

    return true;
  }

  /** Limpia el localStorage completamente. */
  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
