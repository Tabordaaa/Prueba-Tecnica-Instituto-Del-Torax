import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
