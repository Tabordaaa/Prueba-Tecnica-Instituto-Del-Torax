import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { EtlService, EtlResult } from '../../core/etl.service';

interface CsvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

type UploadState = 'idle' | 'validating' | 'validated' | 'processing' | 'completed' | 'error';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.html',
})
export class Upload {
  private readonly etlService = inject(EtlService);

  readonly state = signal<UploadState>('idle');
  readonly fileName = signal('');
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly validationResult = signal<CsvValidationResult | null>(null);
  readonly etlResult = signal<EtlResult | null>(null);
  readonly dragOver = signal(false);

  private allowedExtensions = ['.csv'];
  private requiredColumns = [
    'tipo_documento',
    'documento',
    'nombres',
    'apellidos',
    'fecha_nacimiento',
    'email',
    'ciudad',
    'estado',
  ];
  private maxFileSize = 10 * 1024 * 1024; // 10 MB
  private selectedFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  private processFile(file: File): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.validationResult.set(null);
    this.etlResult.set(null);
    this.fileName.set(file.name);
    this.selectedFile = file;

    // Validación 1: Extensión del archivo
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      this.errorMessage.set(
        `Extensión no válida: "${extension}". Solo se permiten archivos .csv`
      );
      this.state.set('error');
      return;
    }

    // Validación 2: Tamaño del archivo
    if (file.size > this.maxFileSize) {
      this.errorMessage.set(
        `El archivo excede el tamaño máximo permitido (10 MB)`
      );
      this.state.set('error');
      return;
    }

    // Validación 3: Archivo vacío
    if (file.size === 0) {
      this.errorMessage.set('El archivo está vacío');
      this.state.set('error');
      return;
    }

    this.state.set('validating');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.validateCsvContent(content);
    };
    reader.onerror = () => {
      this.errorMessage.set('Error al leer el archivo');
      this.state.set('error');
    };
    reader.readAsText(file);
  }

  private validateCsvContent(content: string): void {
    const result: CsvValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    };

    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');

    // Validación: Archivo vacío (sin contenido)
    if (lines.length === 0) {
      this.errorMessage.set('El archivo está vacío');
      this.state.set('error');
      return;
    }

    // Obtener headers
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Validación: Columnas requeridas
    const missingColumns = this.requiredColumns.filter(
      (col) => !headers.includes(col)
    );
    if (missingColumns.length > 0) {
      this.errorMessage.set(
        `Columnas faltantes: ${missingColumns.join(', ')}. ` +
          `El archivo debe tener las columnas: ${this.requiredColumns.join(', ')}`
      );
      this.state.set('error');
      return;
    }

    const colIndex: Record<string, number> = {};
    headers.forEach((h, i) => (colIndex[h] = i));

    // Validar cada fila
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const cells = row.split(',').map((c) => c.trim());
      const rowNum = i + 1;

      result.totalRows++;

      // Validación: Registros incompletos (menos celdas que headers)
      if (cells.length < headers.length) {
        result.errors.push(
          `Fila ${rowNum}: Registro incompleto (${cells.length} columnas en lugar de ${headers.length})`
        );
        result.invalidRows++;
        continue;
      }

      let rowValid = true;

      // Validar tipo_documento
      const tipoDocumento = cells[colIndex['tipo_documento']]?.toUpperCase();
      const validTipoDocs = ['CC', 'CE', 'TI'];
      if (!tipoDocumento || !validTipoDocs.includes(tipoDocumento)) {
        result.errors.push(`Fila ${rowNum}: Tipo de documento inválido`);
        rowValid = false;
      }

      // Validar documento (solo números)
      const documento = cells[colIndex['documento']];
      if (!documento || !/^\d+$/.test(documento)) {
        result.errors.push(`Fila ${rowNum}: El documento debe contener únicamente números`);
        rowValid = false;
      }

      // Validar nombres
      const nombres = cells[colIndex['nombres']]?.trim().replace(/\s+/g, ' ');
      if (!nombres || nombres.length === 0) {
        result.errors.push(`Fila ${rowNum}: Nombres vacíos`);
        rowValid = false;
      }

      // Validar apellidos
      const apellidos = cells[colIndex['apellidos']]?.trim().replace(/\s+/g, ' ');
      if (!apellidos || apellidos.length === 0) {
        result.errors.push(`Fila ${rowNum}: Apellidos vacíos`);
        rowValid = false;
      }

      // Validar email
      const email = cells[colIndex['email']];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        result.errors.push(`Fila ${rowNum}: Email inválido "${email}"`);
        rowValid = false;
      }

      // Validar fecha_nacimiento
      const fechaNacimiento = cells[colIndex['fecha_nacimiento']];
      const fecha = new Date(fechaNacimiento);
      if (!fechaNacimiento || isNaN(fecha.getTime())) {
        result.errors.push(
          `Fila ${rowNum}: Fecha de nacimiento inválida "${fechaNacimiento}". Formato esperado: YYYY-MM-DD`
        );
        rowValid = false;
      }

      // Validar ciudad
      const ciudad = cells[colIndex['ciudad']]?.trim().replace(/\s+/g, ' ');
      if (!ciudad || ciudad.length === 0) {
        result.errors.push(`Fila ${rowNum}: Ciudad vacía`);
        rowValid = false;
      }

      // Validar estado
      const estado = cells[colIndex['estado']]?.toUpperCase().trim();
      const estadosValidos = ['ACTIVO', 'INACTIVO'];
      if (!estado || !estadosValidos.includes(estado)) {
        result.errors.push(
          `Fila ${rowNum}: Estado inválido "${estado}". Valores válidos: activo, inactivo`
        );
        rowValid = false;
      }

      if (rowValid) {
        result.validRows++;
      } else {
        result.invalidRows++;
      }
    }

    result.isValid = result.invalidRows === 0;

    if (result.isValid) {
      this.successMessage.set(
        `Archivo válido: ${result.totalRows} registros listos para procesar`
      );
    } else if (result.validRows > 0) {
      this.successMessage.set(
        `Archivo parcialmente válido: ${result.validRows} registros válidos, ${result.invalidRows} registros con errores`
      );
    }

    this.validationResult.set(result);
    this.state.set('validated');
  }

  processEtl(): void {
    if (!this.selectedFile) {
      this.errorMessage.set('No hay archivo seleccionado');
      return;
    }

    this.state.set('processing');
    this.errorMessage.set('');
    this.successMessage.set('');

    this.etlService
      .uploadAndProcess(this.selectedFile)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (result) => {
          this.etlResult.set(result);
          this.state.set('completed');
          this.successMessage.set(result.message);
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message ?? 'Error al procesar el archivo'
          );
          this.state.set('error');
        },
      });
  }

  clearFile(): void {
    this.fileName.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
    this.validationResult.set(null);
    this.etlResult.set(null);
    this.state.set('idle');
    this.selectedFile = null;
  }
}
