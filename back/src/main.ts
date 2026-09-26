import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Todas las rutas quedan bajo /api (ej. /api/auth/login, /api/users)
  app.setGlobalPrefix('api');

  // CORS: permite que el front (Angular, que corre en otro puerto) llame a la API
  app.enableCors({ origin: true, credentials: true });

  // Pipe global: valida los DTOs de entrada y elimina propiedades no declaradas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // quita campos que no estan en el DTO
      forbidNonWhitelisted: true, // ademas responde 400 si vienen campos extra
      transform: true, // convierte el body plano en una instancia del DTO
    }),
  );

  // Interceptor global: respeta los @Exclude() de las entidades,
  // por ejemplo el campo password del usuario
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`API escuchando en http://localhost:${port}`);
}

bootstrap();
