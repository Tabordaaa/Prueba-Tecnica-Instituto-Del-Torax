import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * Persona importada desde el archivo CSV.
 * El documento es único para evitar duplicados.
 */
@Entity('people')
@Unique(['documento'])
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  tipoDocumento: string;

  @Column({ length: 20 })
  documento: string;

  @Column({ length: 100 })
  nombres: string;

  @Column({ length: 100 })
  apellidos: string;

  @Column({ type: 'date' })
  fechaNacimiento: Date;

  @Column({ length: 150 })
  email: string;

  @Column({ length: 100 })
  ciudad: string;

  @Column({ length: 10 })
  estado: string;

  @Column({ type: 'int', nullable: true })
  importId: number;

  @CreateDateColumn()
  createdAt: Date;
}
