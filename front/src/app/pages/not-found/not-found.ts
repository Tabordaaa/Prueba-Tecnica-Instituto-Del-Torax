import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="card">
      <h1>404 - No encontrado</h1>
      <p>El recurso que buscas no existe o no tienes permisos para acceder.</p>
      <a routerLink="/dashboard">Volver al Dashboard</a>
    </div>
  `,
})
export class NotFound {}
