import { Component, inject, signal } from '@angular/core';
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
  imports: [DatePipe],
  templateUrl: './history.html',
})
export class History {
  private readonly etlService = inject(EtlService);

  readonly history = signal<HistoryItem[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);

    this.etlService
      .getHistory()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.history.set(response.data),
        error: (error) => {
          const message =
            error?.error?.message ?? 'Error al cargar el historial';
          this.errorMessage.set(message);
        },
      });
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
      COMPLETADO: 'completed',
      PROCESSING: 'processing',
      FAILED: 'failed',
    };
    return classes[status] ?? '';
  }
}
