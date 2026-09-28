import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL, User } from './api';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  /** GET /api/users - solo administradores (lo valida RolesGuard en el back). */
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/users`);
  }

  /** POST /api/users - crea un usuario */
  create(data: { name: string; email: string; password: string; role: string }): Observable<User> {
    return this.http.post<User>(`${API_URL}/users`, data);
  }

  /** PATCH /api/users/:id - actualiza un usuario */
  update(
    id: number,
    data: { name?: string; email?: string; password?: string; role?: string },
  ): Observable<User> {
    return this.http.patch<User>(`${API_URL}/users/${id}`, data);
  }

  /** DELETE /api/users/:id - elimina un usuario */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/users/${id}`);
  }
}
