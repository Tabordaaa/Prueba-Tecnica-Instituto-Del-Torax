import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { EtlService, Person } from '../../core/etl.service';
import { CustomSelect } from './custom-select';

@Component({
  selector: 'app-records',
  imports: [FormsModule, DatePipe, CustomSelect],
  templateUrl: './records.html',
})
export class Records {
  private readonly etlService = inject(EtlService);

  readonly records = signal<Person[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  // Paginación
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(0);

  // Filtros y búsqueda
  readonly search = signal('');
  readonly estado = signal('');
  readonly ciudad = signal('');

  constructor() {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.etlService
      .getPeople({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        estado: this.estado() || undefined,
        ciudad: this.ciudad() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.records.set(response.data);
          this.total.set(response.pagination.total);
          this.totalPages.set(response.pagination.totalPages);
        },
        error: (error) => {
          const message =
            error?.error?.message ?? 'Error al cargar los registros';
          this.errorMessage.set(message);
        },
      });
  }

  // Búsqueda dinámica: se ejecuta al escribir
  onSearchChange(): void {
    this.page.set(1);
    this.loadRecords();
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadRecords();
  }

  onEstadoChange(value: string): void {
    this.estado.set(value);
    this.applyFilters();
  }

  clearFilters(): void {
    this.search.set('');
    this.estado.set('');
    this.ciudad.set('');
    this.page.set(1);
    this.loadRecords();
  }

  onLimitChange(value: string): void {
    this.limit.set(Number(value));
    this.page.set(1);
    this.loadRecords();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.loadRecords();
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  prevPage(): void {
    this.goToPage(this.page() - 1);
  }

  getEstadoClass(estado: string): string {
    return estado === 'ACTIVO' ? 'active' : 'inactive';
  }

  getEstadoLabel(estado: string): string {
    return estado === 'ACTIVO' ? 'Activo' : 'Inactivo';
  }
}
