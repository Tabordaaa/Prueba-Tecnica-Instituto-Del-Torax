import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

import { UserRole } from '../entities/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name: string;

  @IsEmail({}, { message: 'El correo no tiene un formato valido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  // Regla simple de contrasena: una mayuscula, una minuscula y un numero
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'La contrasena debe incluir al menos una minuscula, una mayuscula y un numero',
  })
  password: string;

  // Solo el admin puede crear usuarios indicando el rol
  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser admin o user' })
  role?: UserRole;
}
