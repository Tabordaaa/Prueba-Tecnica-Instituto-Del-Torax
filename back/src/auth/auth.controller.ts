import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService, LoginResponse } from './auth.service';
import { AuthenticatedUser, CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Registro publico. Crea usuarios con rol `user` y responde 201 con el usuario creado. */
  @Public()
  @Post('register')
  @ApiResponse({ status: 201, description: 'Usuario creado.', type: User })
  @ApiResponse({ status: 400, description: 'Datos invalidos (contrasena debil, correo malformed).' })
  @ApiResponse({ status: 409, description: 'El correo ya esta registrado.' })
  register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  /** Login. Responde 200 con `{ accessToken, user }`. */
  @Public()
  @HttpCode(HttpStatus.OK) // sin esto responderia 201 Created
  @Post('login')
  @ApiResponse({ status: 200, description: 'Token de acceso y datos del usuario.', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas o usuario inactivo.' })
  login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  /** Perfil del usuario del token. */
  @ApiBearerAuth()
  @Get('me')
  @ApiResponse({ status: 200, description: 'Usuario autenticado.', type: User })
  @ApiResponse({ status: 401, description: 'Token ausente, invalido o vencido.' })
  me(@CurrentUser() currentUser: AuthenticatedUser): Promise<User> {
    return this.authService.me(currentUser.userId);
  }
}
