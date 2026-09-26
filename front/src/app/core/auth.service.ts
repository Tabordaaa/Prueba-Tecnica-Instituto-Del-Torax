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
  | 'etl'
  | 'records'
  | 'errors'
  | 'reports';

/** Permisos por rol: que vistas puede ver cada rol. */
const ROLE_PERMISSIONS: Record<string, ViewKey[]> = {
  admin: ['dashboard', 'users', 'upload', 'etl', 'records', 'errors', 'reports'],
  operator: ['dashboard', 'upload', 'etl', 'records', 'errors', 'reports'],
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
   */
  readonly user = signal<User | null>(this.readStoredUser());

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
}
