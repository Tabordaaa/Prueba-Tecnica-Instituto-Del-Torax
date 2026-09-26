import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthenticatedUser, CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/auth/register -> registro publico (crea usuarios con rol "user") */
  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  /** POST /api/auth/login -> devuelve { accessToken, user } */
  @Public()
  @HttpCode(HttpStatus.OK) // sin esto responderia 201 Created
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /** GET /api/auth/me -> datos del usuario del token (requiere login) */
  @Get('me')
  me(@CurrentUser() currentUser: AuthenticatedUser): Promise<User> {
    return this.authService.me(currentUser.userId);
  }
}
