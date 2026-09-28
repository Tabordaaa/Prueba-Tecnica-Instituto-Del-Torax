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

  // Modal de formulario state
  readonly showModal = signal(false);
  readonly editingUser = signal<User | null>(null);
  readonly modalLoading = signal(false);

  // Modal de confirmación state
  readonly showConfirmModal = signal(false);
  readonly userToDelete = signal<User | null>(null);
  readonly deleteLoading = signal(false);

  /** Alta/Edición de usuario */
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
    role: ['operator'],
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

  // ========== MODAL DE FORMULARIO ==========

  openCreateModal(): void {
    this.editingUser.set(null);
    this.form.reset({
      name: '',
      email: '',
      password: '',
      role: 'operator',
    });
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showModal.set(true);
  }

  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.form.reset({
      name: user.name,
      email: user.email,
      password: '', // No mostrar la contraseña actual
      role: user.role,
    });
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingUser.set(null);
    this.form.reset();
  }

  // ========== MODAL DE CONFIRMACIÓN ==========

  openDeleteModal(user: User): void {
    if (!this.canDelete(user)) return;
    this.userToDelete.set(user);
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.userToDelete.set(null);
  }

  confirmDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.deleteLoading.set(true);
    this.errorMessage.set('');

    this.usersService.remove(user.id).subscribe({
      next: () => {
        this.successMessage.set('Usuario eliminado correctamente');
        this.deleteLoading.set(false);
        this.closeConfirmModal();
        this.loadUsers();
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.deleteLoading.set(false);
      },
    });
  }

  // ========== CRUD ==========

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.editingUser();
    this.modalLoading.set(true);
    this.errorMessage.set('');

    if (user) {
      // Editar usuario existente
      const { password, ...rest } = this.form.getRawValue();
      const updateData: any = { ...rest, id: user.id };
      if (password) updateData.password = password;

      this.usersService.update(user.id, updateData).subscribe({
        next: () => {
          this.successMessage.set('Usuario actualizado correctamente');
          this.modalLoading.set(false);
          this.closeModal();
          this.loadUsers();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error));
          this.modalLoading.set(false);
        },
      });
    } else {
      // Crear nuevo usuario
      this.usersService.create(this.form.getRawValue()).subscribe({
        next: () => {
          this.successMessage.set('Usuario creado correctamente');
          this.modalLoading.set(false);
          this.closeModal();
          this.loadUsers();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error));
          this.modalLoading.set(false);
        },
      });
    }
  }

  /** No permitir borrar el propio usuario (se quedaria sin sesion) */
  canDelete(user: User): boolean {
    return user.id !== this.authService.user()?.id;
  }

  /** Devuelve la etiqueta amigable para cada rol. */
  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      operator: 'Operador',
      query: 'Consulta',
    };
    return labels[role] ?? role;
  }

  /** Devuelve la clase CSS para cada rol. */
  getRoleClass(role: string): string {
    const classes: Record<string, string> = {
      admin: 'admin',
      operator: 'operator',
      query: 'query',
    };
    return classes[role] ?? '';
  }
}
