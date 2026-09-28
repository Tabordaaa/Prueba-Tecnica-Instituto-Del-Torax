import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { EtlService } from '../../core/etl.service';

interface ErrorByType {
  field: string;
  count: number;
  percentage: number;
}

interface TrendData {
  month: string;
  files: number;
  validRows: number;
  invalidRows: number;
}

interface SummaryData {
  id: number;
  fileName: string;
  importedAt: string;
  importedByName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicatesFound: number;
  importedRows: number;
  status: string;
}

@Component({
  selector: 'app-reports',
  imports: [DatePipe],
  templateUrl: './reports.html',
})
export class Reports {
  private readonly etlService = inject(EtlService);

  // Exponer Math para usar en el template
  readonly Math = Math;

  readonly summary = signal<SummaryData[]>([]);
  readonly errorsByType = signal<ErrorByType[]>([]);
  readonly trends = signal<TrendData[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    // Cargar todas las secciones en paralelo
    Promise.all([
      new Promise<void>((resolve) => {
        this.etlService
          .getReportSummary()
          .pipe(finalize(() => resolve()))
          .subscribe({
            next: (res) => this.summary.set(res.data),
            error: () => resolve(),
          });
      }),
      new Promise<void>((resolve) => {
        this.etlService
          .getErrorsByType()
          .pipe(finalize(() => resolve()))
          .subscribe({
            next: (res) => this.errorsByType.set(res.data),
            error: () => resolve(),
          });
      }),
      new Promise<void>((resolve) => {
        this.etlService
          .getTrends()
          .pipe(finalize(() => resolve()))
          .subscribe({
            next: (res) => this.trends.set(res.data),
            error: () => resolve(),
          });
      }),
    ]).finally(() => this.loading.set(false));
  }

  getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      tipo_documento: 'Tipo de documento',
      documento: 'Documento',
      nombres: 'Nombres',
      apellidos: 'Apellidos',
      email: 'Email',
      fecha_nacimiento: 'Fecha de nacimiento',
      ciudad: 'Ciudad',
      estado: 'Estado',
    };
    return labels[field] ?? field;
  }

  formatMonth(month: string): string {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    const monthName = monthNames[parseInt(monthNum) - 1] ?? monthNum;
    return `${monthName} ${year}`;
  }

  getProgressWidth(percentage: number): string {
    return `${percentage}%`;
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
