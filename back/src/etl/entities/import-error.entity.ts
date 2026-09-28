import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ImportRecord } from './import-record.entity';

/**
 * Error de importación ETL.
 * Almacena los errores encontrados durante el proceso.
 */
@Entity('import_errors')
export class ImportError {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  importId: number;

  @ManyToOne(() => ImportRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'importId' })
  importRecord: ImportRecord;

  @Column()
  rowNumber: number;

  @Column({ length: 100 })
  field: string;

  @Column({ length: 255, nullable: true })
  receivedValue: string;

  @Column({ type: 'text' })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
