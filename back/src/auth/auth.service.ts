import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

/** Respuesta del login que recibe el front (el usuario nunca incluye el hash). */
export interface LoginResponse {
  accessToken: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /** Registro publico: siempre crea usuarios con rol "query". */
  register(registerDto: RegisterDto): Promise<User> {
    return this.usersService.create({ ...registerDto, role: UserRole.QUERY });
  }

  /** Login: valida credenciales y devuelve el token de acceso. */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);

    const passwordMatches =
      user && (await this.usersService.comparePassword(loginDto.password, user.password));

    // Mismo mensaje para "correo no existe" y "contrasena incorrecta":
    // no se revela que correos estan registrados
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('El usuario esta inactivo');
    }

    return {
      accessToken: await this.signToken(user),
      // Se descarta el hash: nunca debe viajar en la respuesta
      user: this.toPublicUser(user),
    };
  }

  /** Perfil del usuario autenticado (GET /api/auth/me). */
  me(userId: number): Promise<User> {
    return this.usersService.findOne(userId);
  }

  /** Genera el JWT firmado. */
  private signToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // La clave y el tiempo de vida se configuran en AuthModule (JwtModule)
    return this.jwtService.signAsync(payload);
  }

  /** Copia del usuario sin el campo password. */
  private toPublicUser(user: User) {
    const { password, ...publicUser } = user;
    return publicUser;
  }
}
