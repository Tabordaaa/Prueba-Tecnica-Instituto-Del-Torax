import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from './api';

export interface EtlResult {
  success: boolean;
  message: string;
  data: {
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
  };
}

export interface Person {
  id: number;
  tipoDocumento: string;
  documento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  email: string;
  ciudad: string;
  estado: string;
  importId: number | null;
  createdAt: string;
}

export interface HistoryItem {
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

@Injectable({ providedIn: 'root' })
export class EtlService {
  private readonly http = inject(HttpClient);

  /**
   * POST /api/etl/upload
   * Sube un archivo CSV y procesa el ETL.
   */
  uploadAndProcess(file: File): Observable<EtlResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<EtlResult>(`${API_URL}/etl/upload`, formData);
  }

  /**
   * GET /api/etl/people
   * Lista todas las personas importadas con paginación, filtros y búsqueda.
   */
  getPeople(params: {
    page?: number;
    limit?: number;
    search?: string;
    estado?: string;
    ciudad?: string;
  }): Observable<{
    success: boolean;
    data: Person[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    let queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.estado) queryParams.set('estado', params.estado);
    if (params.ciudad) queryParams.set('ciudad', params.ciudad);

    const queryString = queryParams.toString();
    const url = `${API_URL}/etl/people${queryString ? `?${queryString}` : ''}`;

    return this.http.get<{
      success: boolean;
      data: Person[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  }

  /**
   * GET /api/etl/history
   * Obtiene el historial de archivos importados.
   */
  getHistory(): Observable<{ success: boolean; data: HistoryItem[] }> {
    return this.http.get<{ success: boolean; data: HistoryItem[] }>(
      `${API_URL}/etl/history`
    );
  }

  /**
   * GET /api/etl/errors
   * Obtiene todos los errores con el nombre del archivo.
   */
  getAllErrors(): Observable<{ success: boolean; data: ImportErrorItem[] }> {
    return this.http.get<{ success: boolean; data: ImportErrorItem[] }>(
      `${API_URL}/etl/errors`
    );
  }

  /**
   * GET /api/etl/errors/files
   * Obtiene la lista de archivos que tienen errores.
   */
  getFilesWithErrors(): Observable<{ success: boolean; data: FileWithError[] }> {
    return this.http.get<{ success: boolean; data: FileWithError[] }>(
      `${API_URL}/etl/errors/files`
    );
  }

  /**
   * GET /api/etl/errors/:importId
   * Obtiene los errores de una importación específica.
   */
  getErrors(
    importId: number,
  ): Observable<{ success: boolean; data: ImportErrorItem[] }> {
    return this.http.get<{ success: boolean; data: ImportErrorItem[] }>(
      `${API_URL}/etl/errors/${importId}`
    );
  }
}

export interface ImportErrorItem {
  importId: number;
  fileName: string;
  rowNumber: number;
  field: string;
  receivedValue: string;
  errorMessage: string;
}

export interface FileWithError {
  importId: number;
  fileName: string;
  errorCount: number;
}
