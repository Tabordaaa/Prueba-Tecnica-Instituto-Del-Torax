import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

import { UserRole } from '../entities/user-role.enum';

/**
 * Actualizacion de usuario: todos los campos son opcionales,
 * se cambia solo lo que se envie.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo no tiene un formato valido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'La contrasena debe incluir al menos una minuscula, una mayuscula y un numero',
  })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser admin o user' })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
