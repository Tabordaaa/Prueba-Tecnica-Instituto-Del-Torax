import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { getErrorMessage, User } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { UsersService } from '../../core/users.service';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './users.html',
})
export class Users {
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  // Lista de usuarios que devuelve el back
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  /** Alta de usuario (solo admin) */
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],
    role: ['user'],
  });

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);

    this.usersService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => this.users.set(users),
        error: (error) => this.errorMessage.set(getErrorMessage(error)),
      });
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');

    this.usersService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.successMessage.set('Usuario creado correctamente');
        this.form.reset({ role: 'user' });
        this.loadUsers();
      },
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  remove(user: User): void {
    if (!confirm(`Eliminar al usuario ${user.name}?`)) {
      return;
    }

    this.errorMessage.set('');

    this.usersService.remove(user.id).subscribe({
      next: () => {
        this.successMessage.set('Usuario eliminado');
        this.loadUsers();
      },
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  /** No permitir borrar el propio usuario (se quedaria sin sesion) */
  canDelete(user: User): boolean {
    return user.id !== this.authService.user()?.id;
  }
}
