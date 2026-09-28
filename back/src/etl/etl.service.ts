import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ImportError } from './entities/import-error.entity';
import { ImportRecord } from './entities/import-record.entity';
import { Person } from './entities/person.entity';

interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  person?: Partial<Person>;
}

interface EtlResult {
  importId: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicatesFound: number;
  importedRows: number;
  errors: Array<{
    rowNumber: number;
    field: string;
    receivedValue: string;
    errorMessage: string;
  }>;
}

@Injectable()
export class EtlService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(ImportRecord)
    private readonly importRecordRepository: Repository<ImportRecord>,
    @InjectRepository(ImportError)
    private readonly importErrorRepository: Repository<ImportError>,
  ) {}

  /**
   * Procesa un archivo CSV completo: valida, transforma y carga los registros.
   */
  async processCsv(
    file: { originalname: string; buffer: Buffer },
    userId: number,
    userName: string,
  ): Promise<EtlResult> {
    console.log('[EtlService] Iniciando proceso ETL...');
    console.log('[EtlService] Archivo:', file?.originalname);

    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const content = file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter((line: string) => line.trim() !== '');
    console.log('[EtlService] Líneas encontradas:', lines.length);

    if (lines.length === 0) {
      throw new BadRequestException('El archivo está vacío');
    }

    // Extraer headers
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());

    // Columnas requeridas
    const requiredColumns = [
      'tipo_documento',
      'documento',
      'nombres',
      'apellidos',
      'fecha_nacimiento',
      'email',
      'ciudad',
      'estado',
    ];

    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Columnas faltantes: ${missingColumns.join(', ')}`,
      );
    }

    const colIndex: Record<string, number> = {};
    headers.forEach((h: string, i: number) => (colIndex[h] = i));

    // Crear registro de importación
    console.log('[EtlService] Creando registro de importación...');
    let importRecord;
    try {
      importRecord = await this.importRecordRepository.save(
        this.importRecordRepository.create({
          fileName: file.originalname,
          importedBy: userId,
          importedByName: userName,
          totalRows: lines.length - 1,
          validRows: 0,
          invalidRows: 0,
          duplicatesFound: 0,
          importedRows: 0,
          status: 'PROCESSING',
        }),
      );
      console.log('[EtlService] Registro de importación creado:', importRecord.id);
    } catch (error) {
      console.error('[EtlService] Error creando registro de importación:', error);
      throw error;
    }

    const result: EtlResult = {
      importId: importRecord.id,
      totalRows: lines.length - 1,
      validRows: 0,
      invalidRows: 0,
      duplicatesFound: 0,
      importedRows: 0,
      errors: [],
    };

    const seenDocuments = new Set<string>();
    const peopleToInsert: Partial<Person>[] = [];

    // Procesar cada fila
    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const cells = lines[i].split(',').map((c: string) => c.trim());

      const validation = this.validateRow(cells, colIndex, rowNum, seenDocuments);

      if (validation.isValid && validation.person) {
        peopleToInsert.push({
          ...validation.person,
          importId: importRecord.id,
        });
        seenDocuments.add(validation.person.documento || '');
        result.validRows++;
      } else {
        result.invalidRows++;
        for (const error of validation.errors) {
          result.errors.push({
            rowNumber: rowNum,
            field: error.field,
            receivedValue: error.receivedValue,
            errorMessage: error.errorMessage,
          });
          await this.importErrorRepository.save(
            this.importErrorRepository.create({
              importId: importRecord.id,
              rowNumber: rowNum,
              field: error.field,
              receivedValue: error.receivedValue,
              errorMessage: error.errorMessage,
            }),
          );
        }
      }
    }

    // Detectar duplicados en BD y filtrar
    const validPeople: Partial<Person>[] = [];
    for (const person of peopleToInsert) {
      const exists = await this.personRepository.findOneBy({
        documento: person.documento || '',
      });
      if (exists) {
        result.duplicatesFound++;
        result.validRows--;
        result.errors.push({
          rowNumber: 0,
          field: 'documento',
          receivedValue: person.documento || '',
          errorMessage: `Documento duplicado en base de datos: ${person.documento}`,
        });
      } else {
        validPeople.push(person);
      }
    }

    // Insertar en lotes
    if (validPeople.length > 0) {
      console.log('[EtlService] Insertando', validPeople.length, 'registros...');
      const chunks = this.chunkArray(validPeople, 100);
      for (let i = 0; i < chunks.length; i++) {
        try {
          await this.personRepository.save(chunks[i]);
          console.log('[EtlService] Lote', i + 1, 'insertado correctamente');
        } catch (error) {
          console.error('[EtlService] Error insertando lote', i + 1, ':', error);
          throw error;
        }
      }
    }

    result.importedRows = validPeople.length;

    // Actualizar registro de importación
    await this.importRecordRepository.update(importRecord.id, {
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      duplicatesFound: result.duplicatesFound,
      importedRows: result.importedRows,
      status: 'completed',
    });

    return result;
  }

  /**
   * Valida una fila del CSV.
   */
  private validateRow(
    cells: string[],
    colIndex: Record<string, number>,
    rowNum: number,
    seenDocuments: Set<string>,
  ): ValidationResult {
    const errors: ImportError[] = [];
    const person: Partial<Person> = {};

    // Validar tipo_documento
    const tipoDocumento = cells[colIndex['tipo_documento']]?.toUpperCase();
    const validTipoDocs = ['CC', 'CE', 'TI'];
    if (!tipoDocumento || !validTipoDocs.includes(tipoDocumento)) {
      errors.push({
        id: 0,
        importId: 0,
        rowNumber: rowNum,
        field: 'tipo_documento',
        receivedValue: cells[colIndex['tipo_documento']],
        errorMessage: `Tipo de documento inválido. Valores válidos: ${validTipoDocs.join(', ')}`,
        createdAt: new Date(),
      } as ImportError);
    } else {
      person.tipoDocumento = tipoDocumento;
    }

    // Validar documento (solo números)
    const documento = cells[colIndex['documento']];
    if (!documento || !/^\d+$/.test(documento)) {
      errors.push({
        id: 0,
        importId: 0,
        rowNumber: rowNum,
        field: 'documento',
        receivedValue: documento,
        errorMessage: 'El documento debe contener únicamente caracteres numéricos',
        createdAt: new Date(),
      } as ImportError);
    } else if (seenDocuments.has(documento)) {
      errors.push({
        id: 0,
        importId: 0,
        rowNumber: rowNum,
        field: 'documento',
        receivedValue: documento,
        errorMessage: `Documento duplicado en el archivo: ${documento}`,
        createdAt: new Date(),
      } as ImportError);
    } else {
      person.documento = documento;
    }

    // Validar nombres (eliminar espacios innecesarios)
    const nombres = cells[colIndex['nombres']]?.trim().replace(/\s+/g, ' ');
    if (!nombres || nombres.length === 0) {
      errors.push({
        id: 0,
        importId: 0,
        rowNumber: rowNum,
        field: 'nombres',
        receivedValue: cells[colIndex['nombres']],
        errorMessage: 'Los nombres son obligatorios',
        createdAt: new Date(),
      } as ImportError);
    } else {
      person.nombres = nombres;
    }

    // Validar apellidos
    const apellidos = cells[colIndex['apellidos']]?.trim().replace(/\s+/g, ' ');
    if (!apellidos || apellidos.length === 0) {
      errors.push({
        id: 0,
        importId: 0,
        rowNumber: rowNum,
        field: 'apellidos',
        receivedValue: cells[colIndex['apellidos']],
        errorMessage: 'Los apellidos son obligatorios',
        createdAt: new Date(),
      } as ImportError);
    } else {
      person.apellidos = apellidos;
    }

    // Validar email
    const email = cells[colIndex['email']];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push({
        id: 0,
        importId: 0,
        rowNumber: rowNum,
        field: 'email',
        receivedValue: email,
        errorMessage: 'Formato de email inválido',
        createdAt: new Date(),
      } as ImportError);
    } else {
      person.email = email;
    }

    // Validar fecha_nacimiento
    const fechaNacimiento = cells[colIndex['fecha_nacimiento']];
    const fecha = new Date(fechaNacimiento);
    if (!fechaNacimiento || isNaN(fecha.getTime())) {
      errors.push({
        id: 0,
        importId: 0,
        rowNumber: rowNum,
        field: 'fecha_nacimiento',
        receivedValue: fechaNacimiento,
        errorMessage: 'Fecha de nacimiento inválida. Formato esperado: YYYY-MM-DD',
        createdAt: new Date(),
      } as ImportError);
    } else {
      person.fechaNacimiento = fecha;
    }

    // Validar ciudad
    const ciudad = cells[colIndex['ciudad']]?.trim().replace(/\s+/g, ' ');
    if (!ciudad || ciudad.length === 0) {
      errors.push({
        id: 0,
        importId: 0,
        rowNumber: rowNum,
        field: 'ciudad',
        receivedValue: cells[colIndex['ciudad']],
        errorMessage: 'La ciudad es obligatoria',
        createdAt: new Date(),
      } as ImportError);
    } else {
      person.ciudad = ciudad;
    }

    // Validar estado (normalizar a ACTIVO/INACTIVO)
    const estado = cells[colIndex['estado']]?.toUpperCase().trim();
    const validEstados = ['ACTIVO', 'INACTIVO'];
    if (!estado || !validEstados.includes(estado)) {
      errors.push({
        id: 0,
        importId: 0,
        rowNumber: rowNum,
        field: 'estado',
        receivedValue: cells[colIndex['estado']],
        errorMessage: `Estado inválido. Valores válidos: ${validEstados.join(', ')}`,
        createdAt: new Date(),
      } as ImportError);
    } else {
      person.estado = estado;
    }

    return {
      isValid: errors.length === 0,
      errors,
      person: errors.length === 0 ? person : undefined,
    };
  }

  /**
   * Obtiene el historial de archivos importados.
   */
  async getHistory(): Promise<
    Array<{
      id: number;
      fileName: string;
      importedAt: Date;
      importedBy: number;
      importedByName: string;
      totalRows: number;
      validRows: number;
      invalidRows: number;
      duplicatesFound: number;
      importedRows: number;
      status: string;
    }>
  > {
    const records = await this.importRecordRepository.find({
      order: { importedAt: 'DESC' },
    });

    return records.map((record) => ({
      id: record.id,
      fileName: record.fileName,
      importedAt: record.importedAt,
      importedBy: record.importedBy,
      importedByName: record.importedByName ?? 'Desconocido',
      totalRows: record.totalRows,
      validRows: record.validRows,
      invalidRows: record.invalidRows,
      duplicatesFound: record.duplicatesFound,
      importedRows: record.importedRows,
      status: record.status,
    }));
  }

  /**
   * Obtiene los errores de una importación específica.
   */
  async getErrors(
    importId: number,
  ): Promise<
    Array<{
      rowNumber: number;
      field: string;
      receivedValue: string;
      errorMessage: string;
    }>
  > {
    const errors = await this.importErrorRepository.find({
      where: { importId },
      order: { rowNumber: 'ASC' },
    });

    return errors.map((error) => ({
      rowNumber: error.rowNumber,
      field: error.field,
      receivedValue: error.receivedValue ?? '',
      errorMessage: error.errorMessage,
    }));
  }

  /**
   * Obtiene todos los errores con el nombre del archivo asociado.
   */
  async getAllErrors(): Promise<
    Array<{
      importId: number;
      fileName: string;
      rowNumber: number;
      field: string;
      receivedValue: string;
      errorMessage: string;
    }>
  > {
    const errors = await this.importErrorRepository.find({
      relations: { importRecord: true },
      order: { rowNumber: 'ASC' },
    });

    return errors.map((error) => ({
      importId: error.importId,
      fileName: error.importRecord?.fileName ?? 'Desconocido',
      rowNumber: error.rowNumber,
      field: error.field,
      receivedValue: error.receivedValue ?? '',
      errorMessage: error.errorMessage,
    }));
  }

  /**
   * Obtiene la lista de archivos que tienen errores.
   */
  async getFilesWithErrors(): Promise<
    Array<{
      importId: number;
      fileName: string;
      errorCount: number;
    }>
  > {
    const errors = await this.importErrorRepository.find({
      relations: { importRecord: true },
    });

    // Agrupar por archivo y contar errores
    const fileMap = new Map<number, { fileName: string; errorCount: number }>();

    for (const error of errors) {
      const existing = fileMap.get(error.importId);
      if (existing) {
        existing.errorCount++;
      } else {
        fileMap.set(error.importId, {
          fileName: error.importRecord?.fileName ?? 'Desconocido',
          errorCount: 1,
        });
      }
    }

    return Array.from(fileMap.entries()).map(([importId, data]) => ({
      importId,
      ...data,
    }));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
