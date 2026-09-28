# Back (NestJS + TypeORM + MySQL + JWT)

API de autenticacion y manejo de usuarios.

```
src/
├── main.ts                     # bootstrap: CORS, ValidationPipe, prefijo /api
├── app.module.ts               # ConfigModule (.env) + conexion MySQL con TypeORM
├── config/env.validation.ts    # valida las variables de entorno al arrancar
├── seed.ts                     # crea el usuario admin inicial (npm run seed)
├── auth/
│   ├── auth.controller.ts      # POST /auth/register, POST /auth/login, GET /auth/me
│   ├── auth.service.ts         # registro, login y firma del token
│   ├── auth.module.ts          # JwtModule + guards globales (APP_GUARD)
│   ├── strategies/             # JwtStrategy (valida el token en cada request)
│   ├── guards/                 # JwtAuthGuard (autenticacion) y RolesGuard (autorizacion)
│   └── decorators/             # @Public(), @Roles(), @CurrentUser()
├── users/
│   ├── users.controller.ts     # CRUD (protegido con @Roles(UserRole.ADMIN))
│   ├── users.service.ts        # consultas TypeORM + hash bcrypt
│   ├── entities/               # User y UserRole
│   └── dto/                    # CreateUserDto y UpdateUserDto
└── etl/                        # carga de CSV, historial, reportes y personas
```

## Comandos

```bash
npm install
cp .env.example .env     # configurar credenciales de MySQL y JWT_SECRET
npm run seed             # crea el usuario admin de prueba
npm run start:dev        # http://localhost:3000
npm run build            # compila a dist/
```

## Documentacion Swagger

Al arrancar la API queda disponible la documentacion interactiva en
**http://localhost:3000/docs** (el JSON OpenAPI en `/docs-json`).

Como usarla:

1. Ejecutar `POST /api/auth/login` con el admin y copiar el `accessToken`.
2. Click en **Authorize**, pegar el token y confirmar.
3. Ya se pueden probar todas las rutas protegidas desde el navegador
   (los candados de la UI indican cuales requieren token).

Que documenta:

- Los 18 endpoints del proyecto, agrupados en tres secciones: `auth` (3),
  `usuarios` (5) y `etl` (10).
- Los cuerpos de entrada: el plugin toma `required`, `minLength`, `format: email` y
  el patron de contrasena directamente de las reglas de `class-validator`.
- Los codigos de respuesta de cada endpoint (200, 201, 400, 401, 403, 404, 409).
- El envio del archivo CSV en `POST /api/etl/upload` (`multipart/form-data`).

Como quedo configurado:

- `nest-cli.json` registra el plugin `@nestjs/swagger` con `classValidatorShim`
  (los `required`, `minLength` y patrones de los DTOs se toman de las reglas de
  `class-validator`) e `introspectComments` (los comentarios JSDoc de los metodos
  aparecen como descripcion en la UI).
- `main.ts` arma el `DocumentBuilder` (titulo, version, tags y `addBearerAuth`) y
  publica la UI con `SwaggerModule.setup('docs', ...)`.
- Los controladores se agrupan con `@ApiTags` (`auth`, `usuarios`, `etl`), declaran
  `@ApiBearerAuth()` y documentan los errores con `@ApiResponse`.
- `password` de la entidad `User` lleva `@ApiHideProperty`: no se documenta porque
  nunca sale en las respuestas.
- La respuesta del login se documenta con `LoginResponseDto`
  (`auth/dto/login-response.dto.ts`).

Al agregar un endpoint nuevo basta con poner `@ApiTags` en el controlador y
`@ApiResponse` en los metodos: el resto de los metadatos los genera el plugin.
