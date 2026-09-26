import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_URL, LoginResponse, User } from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

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
