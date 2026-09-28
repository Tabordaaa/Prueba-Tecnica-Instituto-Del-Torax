import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /** Crea un usuario. El correo no puede estar repetido. */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role = UserRole.QUERY, ...rest } = createUserDto;

    const emailTaken = await this.usersRepository.findOneBy({ email });
    if (emailTaken) {
      throw new ConflictException('El correo ya esta registrado');
    }

    const user = this.usersRepository.create({
      ...rest,
      email,
      // La contrasena jamas se guarda en texto plano, se guarda su hash
      password: await this.hashPassword(password),
      role,
    });

    return this.usersRepository.save(user);
  }

  /** Lista todos los usuarios (sin el campo password). */
  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  /** Busca un usuario por id. Lanza 404 si no existe. */
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return user;
  }

  /**
   * Busca un usuario incluyendo la columna password.
   * Necesario para el login, porque en la entidad esa columna tiene select: false.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  /** Actualiza los campos indicados de un usuario. */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id); // si no existe, responde 404
    const { password, email, ...rest } = updateUserDto;

    // Solo se valida el correo si realmente esta cambiando
    if (email && email !== user.email) {
      const emailTaken = await this.usersRepository.findOneBy({ email });
      if (emailTaken) {
        throw new ConflictException('El correo ya esta registrado');
      }
    }

    Object.assign(user, rest);
    if (email) user.email = email;
    if (password) user.password = await this.hashPassword(password);

    return this.usersRepository.save(user);
  }

  /** Elimina un usuario. */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id); // si no existe, responde 404
    await this.usersRepository.remove(user);
  }

  /** Genera el hash de una contrasena con bcrypt. */
  hashPassword(password: string): Promise<string> {
    // 10 rondas es el valor por defecto recomendado para bcrypt
    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
    return bcrypt.hash(password, saltRounds);
  }

  /** Compara una contrasena en texto plano contra su hash. */
  comparePassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}
