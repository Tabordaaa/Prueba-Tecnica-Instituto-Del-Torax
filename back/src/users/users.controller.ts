import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.enum';
import { UsersService } from './users.service';

/**
 * Gestion de usuarios.
 *
 * Todas las rutas requieren un token JWT valido y el rol ADMIN
 * (eso lo aplican JwtAuthGuard + RolesGuard, registrados de forma global
 * en AuthModule con APP_GUARD).
 */
@ApiTags('usuarios')
@ApiBearerAuth()
@Roles(UserRole.ADMIN) // a nivel de clase: aplica a todas las rutas de abajo
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Crea un usuario. Solo el administrador puede indicar el rol. */
  @Post()
  @ApiResponse({ status: 201, description: 'Usuario creado.', type: User })
  @ApiResponse({ status: 400, description: 'Datos invalidos.' })
  @ApiResponse({ status: 409, description: 'El correo ya esta registrado.' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  /** Lista todos los usuarios. */
  @Get()
  @ApiResponse({ status: 200, description: 'Lista de usuarios.', type: [User] })
  @ApiResponse({ status: 401, description: 'Token ausente o invalido.' })
  @ApiResponse({ status: 403, description: 'Se requiere rol admin.' })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  /** Usuario por id. */
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Id numerico del usuario', example: 1 })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.', type: User })
  @ApiResponse({ status: 404, description: 'El usuario no existe.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  /** Actualiza nombre, correo, contrasena, rol o estado de un usuario. */
  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Id numerico del usuario', example: 1 })
  @ApiResponse({ status: 200, description: 'Usuario actualizado.', type: User })
  @ApiResponse({ status: 400, description: 'Datos invalidos.' })
  @ApiResponse({ status: 404, description: 'El usuario no existe.' })
  @ApiResponse({ status: 409, description: 'El correo ya esta registrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  /** Elimina un usuario. */
  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Id numerico del usuario', example: 1 })
  @ApiResponse({ status: 200, description: 'Usuario eliminado.' })
  @ApiResponse({ status: 404, description: 'El usuario no existe.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
