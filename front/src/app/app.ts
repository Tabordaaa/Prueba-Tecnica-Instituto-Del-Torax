import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Indica si la ruta actual es login o not-found (para ocultar el menu). */
  protected isLoginOrNotFound(): boolean {
    return this.router.url === '/login' || this.router.url === '/not-found';
  }

  // logout() borra el token y ya redirige al login
  protected logout(): void {
    this.authService.logout();
  }
}
