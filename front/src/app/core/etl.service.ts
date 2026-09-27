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
   * Lista todas las personas importadas.
   */
  getPeople(): Observable<{ success: boolean; data: Person[] }> {
    return this.http.get<{ success: boolean; data: Person[] }>(
      `${API_URL}/etl/people`
    );
  }
}
