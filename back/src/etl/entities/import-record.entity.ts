import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Registro de importación ETL.
 * Almacena información sobre cada archivo procesado.
 *
 * Campos según requerimiento:
 * - ID
 * - Nombre original
 * - Fecha de carga
 * - Usuario que realizó la carga
 * - Total de registros
 * - Registros válidos
 * - Registros inválidos
 * - Estado
 */
@Entity('import_records')
export class ImportRecord {
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre original del archivo */
  @Column({ length: 255 })
  fileName: string;

  /** Fecha de carga (se genera automáticamente) */
  @CreateDateColumn()
  importedAt: Date;

  /** ID del usuario que realizó la carga */
  @Column({ type: 'int', default: 0 })
  importedBy: number;

  /** Nombre del usuario que realizó la carga (guardado directamente) */
  @Column({ length: 100, nullable: true })
  importedByName: string;

  /** Total de registros en el archivo */
  @Column({ default: 0 })
  totalRows: number;

  /** Registros válidos */
  @Column({ default: 0 })
  validRows: number;

  /** Registros inválidos */
  @Column({ default: 0 })
  invalidRows: number;

  /** Registros duplicados encontrados */
  @Column({ default: 0 })
  duplicatesFound: number;

  /** Registros importados exitosamente */
  @Column({ default: 0 })
  importedRows: number;

  /** Estado del proceso: PROCESSING, COMPLETED, FAILED */
  @Column({ length: 50, default: 'COMPLETED' })
  status: string;
}
