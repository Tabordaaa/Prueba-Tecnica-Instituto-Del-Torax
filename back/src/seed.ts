import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { UserRole } from './users/entities/user-role.enum';
import { UsersService } from './users/users.service';

/**
 * Crea el usuario administrador inicial para poder entrar al panel de usuarios.
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

  const email = config.get<string>('ADMIN_EMAIL', 'admin@instituto.com');

  const existingUser = await usersService.findByEmailWithPassword(email);

  if (existingUser) {
    console.log(`El usuario ${email} ya existe, no se hace nada.`);
  } else {
    await usersService.create({
      name: config.get<string>('ADMIN_NAME', 'Admin'),
      email,
      password: config.get<string>('ADMIN_PASS', 'Admin1234'),
      role: UserRole.ADMIN,
    });

    console.log(`Usuario administrador creado: ${email}`);
  }

  await app.close();
}

seed();
