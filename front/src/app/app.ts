import { Component, inject, signal } from '@angular/core';
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

  /** Estado del sidebar: true = abierto, false = cerrado */
  readonly sidebarOpen = signal(true);

  /** Indica si la ruta actual es login o not-found (para ocultar el sidebar) */
  protected isLoginOrNotFound(): boolean {
    return this.router.url === '/login' || this.router.url === '/not-found';
  }

  /** Alterna el estado del sidebar */
  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
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

  // logout() borra el token y ya redirige al login
  protected logout(): void {
    this.authService.logout();
  }
}
