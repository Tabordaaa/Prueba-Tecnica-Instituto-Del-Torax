import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Registro de importación ETL.
 * Almacena información sobre cada archivo procesado.
 */
@Entity('import_records')
export class ImportRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  fileName: string;

  @Column()
  totalRows: number;

  @Column()
  validRows: number;

  @Column()
  invalidRows: number;

  @Column()
  duplicatesFound: number;

  @Column()
  importedRows: number;

  @Column({ type: 'int', default: 0 })
  importedBy: number;

  @CreateDateColumn()
  importedAt: Date;

  @Column({ length: 50, default: 'completed' })
  status: string;
}
