import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { EtlService, FileWithError, ImportErrorItem } from '../../core/etl.service';

@Component({
  selector: 'app-errors',
  imports: [FormsModule],
  templateUrl: './errors.html',
})
export class Errors {
  private readonly etlService = inject(EtlService);

  readonly files = signal<FileWithError[]>([]);
  readonly errors = signal<ImportErrorItem[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly selectedFileId = signal<number | null>(null);

  // Paginación
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly paginatedErrors = signal<ImportErrorItem[]>([]);

  constructor() {
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.etlService
      .getFilesWithErrors()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.files.set(response.data);
          // Cargar errores del primer archivo por defecto
          if (response.data.length > 0) {
            this.selectFile(response.data[0].importId);
          }
        },
        error: (error) => {
          const message =
            error?.error?.message ?? 'Error al cargar los archivos';
          this.errorMessage.set(message);
        },
      });
  }

  selectFile(importId: number): void {
    this.selectedFileId.set(importId);
    this.loadErrors(importId);
  }

  loadErrors(importId: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.etlService
      .getErrors(importId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.errors.set(response.data);
          this.total.set(response.data.length);
          this.totalPages.set(Math.ceil(response.data.length / this.limit()));
          this.page.set(1);
          this.updatePaginatedErrors();
        },
        error: (error) => {
          const message =
            error?.error?.message ?? 'Error al cargar los errores';
          this.errorMessage.set(message);
        },
      });
  }

  private updatePaginatedErrors(): void {
    const errors = this.errors();
    const start = (this.page() - 1) * this.limit();
    const end = start + this.limit();
    this.paginatedErrors.set(errors.slice(start, end));
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.updatePaginatedErrors();
    }
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.updatePaginatedErrors();
    }
  }

  changeLimit(): void {
    this.page.set(1);
    this.totalPages.set(Math.ceil(this.total() / this.limit()));
    this.updatePaginatedErrors();
  }

  readonly selectedFileName = computed(() => {
    const selected = this.files().find(
      (f) => f.importId === this.selectedFileId()
    );
    return selected?.fileName ?? 'Seleccione un archivo';
  });

  getErrorClass(field: string): string {
    const classes: Record<string, string> = {
      email: 'email',
      documento: 'documento',
      estado: 'estado',
      fecha_nacimiento: 'fecha',
      nombres: 'nombres',
      apellidos: 'apellidos',
      tipo_documento: 'tipo',
      ciudad: 'ciudad',
    };
    return classes[field] ?? '';
  }
}
