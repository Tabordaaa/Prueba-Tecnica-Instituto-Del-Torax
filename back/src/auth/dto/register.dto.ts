import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * Registro publico. No se puede elegir el rol desde aqui:
 * el rol se asigna en AuthService (siempre user); solo el admin puede
 * cambiarlo luego desde POST /api/users o PATCH /api/users/:id.
 */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name: string;

  @IsEmail({}, { message: 'El correo no tiene un formato valido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'La contrasena debe incluir al menos una minuscula, una mayuscula y un numero',
  })
  password: string;
}
