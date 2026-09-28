import { Component, inject, signal } from '@angular/core';
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
        next: (response) => this.errors.set(response.data),
        error: (error) => {
          const message =
            error?.error?.message ?? 'Error al cargar los errores';
          this.errorMessage.set(message);
        },
      });
  }

  getSelectedFileName(): string {
    const selected = this.files().find(
      (f) => f.importId === this.selectedFileId()
    );
    return selected?.fileName ?? '';
  }

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
