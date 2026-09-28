import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { UserRole } from './users/entities/user-role.enum';
import { UsersService } from './users/users.service';

/**
 * Crea los usuarios iniciales del sistema.
 *
 * Ejecutar con:  npm run seed
 *
 * Es idempotente: si el correo ya existe, no vuelve a crearlo.
 */
async function seed() {
  // createApplicationContext levanta la app sin servidor HTTP,
  // de este modo reutiliza la conexion de TypeORM ya configurada
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const config = app.get(ConfigService);

  const usersToCreate = [
    {
      name: config.get<string>('ADMIN_NAME', 'Admin'),
      email: config.get<string>('ADMIN_EMAIL', 'admin@instituto.com'),
      password: config.get<string>('ADMIN_PASS', 'Admin1234'),
      role: UserRole.ADMIN,
    },
    {
      name: config.get<string>('OPERATOR_NAME', 'Operador'),
      email: config.get<string>('OPERATOR_EMAIL', 'operador@instituto.com'),
      password: config.get<string>('OPERATOR_PASS', 'Operador1234'),
      role: UserRole.OPERATOR,
    },
    {
      name: config.get<string>('QUERY_NAME', 'Consulta'),
      email: config.get<string>('QUERY_EMAIL', 'consulta@instituto.com'),
      password: config.get<string>('QUERY_PASS', 'Consulta1234'),
      role: UserRole.QUERY,
    },
  ];

  for (const userData of usersToCreate) {
    const existingUser = await usersService.findByEmailWithPassword(userData.email);

    if (existingUser) {
      console.log(`El usuario ${userData.email} ya existe, no se hace nada.`);
    } else {
      await usersService.create(userData);
      console.log(`Usuario ${userData.role} creado: ${userData.email}`);
    }
  }

  await app.close();
}

seed();
