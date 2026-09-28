import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { EtlService } from '../../core/etl.service';

interface HistoryItem {
  id: number;
  fileName: string;
  importedAt: string;
  importedBy: number;
  importedByName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicatesFound: number;
  importedRows: number;
  status: string;
}

@Component({
  selector: 'app-history',
  imports: [FormsModule, DatePipe],
  templateUrl: './history.html',
})
export class History {
  private readonly etlService = inject(EtlService);

  readonly history = signal<HistoryItem[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  // Paginación
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(0);

  // Filtros
  readonly search = signal('');

  constructor() {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    // Por ahora cargamos todo y filtramos en el frontend
    // En el futuro se puede mover al backend
    this.etlService
      .getHistory()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          let items = response.data;

          // Filtro por búsqueda
          if (this.search()) {
            const searchLower = this.search().toLowerCase();
            items = items.filter(
              (item) =>
                item.fileName.toLowerCase().includes(searchLower) ||
                item.importedByName.toLowerCase().includes(searchLower),
            );
          }

          this.total.set(items.length);
          this.totalPages.set(Math.ceil(items.length / this.limit()));

          // Paginación
          const start = (this.page() - 1) * this.limit();
          const end = start + this.limit();
          this.history.set(items.slice(start, end));
        },
        error: (error) => {
          const message =
            error?.error?.message ?? 'Error al cargar el historial';
          this.errorMessage.set(message);
        },
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadHistory();
  }

  clearFilters(): void {
    this.search.set('');
    this.page.set(1);
    this.loadHistory();
  }

  changeLimit(): void {
    this.page.set(1);
    this.loadHistory();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.loadHistory();
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  prevPage(): void {
    this.goToPage(this.page() - 1);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      COMPLETADO: 'Completado',
      PROCESSING: 'Procesando',
      FAILED: 'Fallido',
    };
    return labels[status] ?? status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      COMPLETED: 'COMPLETED',
      PROCESSING: 'PROCESSING',
      FAILED: 'FAILED',
    };
    return classes[status] ?? '';
  }
}
