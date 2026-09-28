import { ApiProperty } from '@nestjs/swagger';

import { User } from '../../users/entities/user.entity';

/** Respuesta del login: el token que se envia como `Authorization: Bearer <token>`. */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT para las peticiones protegidas',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ description: 'Datos del usuario autenticado', type: User })
  user: User;
}
