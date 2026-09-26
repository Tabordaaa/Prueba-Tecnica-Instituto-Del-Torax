import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { validateEnv } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Carga el .env y lo deja disponible en toda la app (isGlobal: true)
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    // Conexion a MySQL con TypeORM.
    // forRootAsync permite leer la configuracion de ConfigService (variables de entorno).
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS', ''),
        database: config.get<string>('DB_NAME'),
        // Lista de entidades que TypeORM debe mapear
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // En desarrollo TypeORM crea/actualiza las tablas solo a partir de las entidades.
        // IMPORTANTE: en produccion se debe poner en false y usar migraciones
        // (npm run typeorm migration:generate / migration:run).
        synchronize: true,
        logging: ['error', 'warn'], // 'query' para ver las consultas SQL en consola
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),

    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
