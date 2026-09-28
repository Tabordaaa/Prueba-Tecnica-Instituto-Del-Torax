import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { EtlService } from '../../core/etl.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly etlService = inject(EtlService);

  readonly stats = signal({
    totalUsers: 0,
    totalFiles: 0,
    totalRecords: 0,
    totalValidRows: 0,
    totalInvalidRows: 0,
  });
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.etlService
      .getDashboardStats()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.stats.set(response.data),
        error: (error) => {
          const message =
            error?.error?.message ?? 'Error al cargar las estadísticas';
          this.errorMessage.set(message);
        },
      });
  }
}
