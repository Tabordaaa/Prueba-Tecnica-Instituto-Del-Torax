import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  // unique: no puede existir mas de un usuario con el mismo correo
  @Column({ length: 150, unique: true })
  email: string;

  /**
   * select: false -> TypeORM NUNCA incluye la columna en los SELECT salvo que se pida
   * explicitamente con addSelect(). Asi es imposible filtrar el hash por error
   * en una respuesta de la API.
   *
   * @Exclude() + ClassSerializerInterceptor (registrado en main.ts) terminan de
   * proteger los casos en que el hash queda en memoria, por ejemplo tras un save().
   */
  @Exclude()
  @Column({ length: 255, select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
