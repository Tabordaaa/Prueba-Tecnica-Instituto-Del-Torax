import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

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
@Roles(UserRole.ADMIN) // a nivel de clase: aplica a todas las rutas de abajo
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** POST /api/users -> crea un usuario (admin) */
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  /** GET /api/users -> lista todos los usuarios (admin) */
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  /** GET /api/users/:id -> usuario por id (admin) */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  /** PATCH /api/users/:id -> actualiza un usuario (admin) */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  /** DELETE /api/users/:id -> elimina un usuario (admin) */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
