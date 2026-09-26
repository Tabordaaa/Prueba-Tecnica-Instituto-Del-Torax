import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { getErrorMessage } from '../../core/api';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  // Mismas validaciones que pide el back (clase-validator)
  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // muestra los errores de los campos
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService
      .login(this.form.getRawValue())
      // finalize se ejecuta tanto en caso de exito como de error
      // (con complete el boton quedaria deshabilitado si la peticion falla)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        // El token ya quedo guardado en el AuthService
        next: () => this.router.navigate(['/home']),
        error: (error) => this.errorMessage.set(getErrorMessage(error)),
      });
  }
}
