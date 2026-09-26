import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';

/** Contenido que se firma dentro del token. */
export interface JwtPayload {
  sub: number; // id del usuario
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // El token se lee de la cabecera: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // un token vencido se rechaza
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida el token y devuelve el usuario. Lo que se retorne aqui
   * queda disponible en request.user.
   *
   * Se consulta la base de datos en cada request para que:
   * - un token de un usuario eliminado deje de servir,
   * - un usuario desactivado no pueda entrar.
   */
  async validate(payload: JwtPayload) {
    let user;

    try {
      user = await this.usersService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException('Token invalido: el usuario no existe');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('El usuario esta inactivo');
    }

    return { userId: user.id, email: user.email, role: user.role };
  }
}
