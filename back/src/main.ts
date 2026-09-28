import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // Documentacion interactiva de la API (Swagger UI): http://localhost:3000/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Instituto del Torax')
    .setDescription('API de autenticacion con JWT y manejo de usuarios')
    .setVersion('1.0')
    // Secciones de la UI, en este orden
    .addTag('auth', 'Registro, login y perfil del usuario autenticado')
    .addTag('usuarios', 'Gestion de usuarios (solo administradores)')
    .addTag('etl', 'Carga de archivos CSV, historial, reportes y personas')
    // Boton "Authorize" para probar las rutas protegidas pegando el accessToken
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    // mantiene el token al recargar la pagina de /docs
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`API escuchando en http://localhost:${port}`);
  console.log(`Documentacion Swagger en http://localhost:${port}/docs`);
}

bootstrap();
