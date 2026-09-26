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
└── users/
    ├── users.controller.ts     # CRUD (protegido con @Roles(UserRole.ADMIN))
    ├── users.service.ts        # consultas TypeORM + hash bcrypt
    ├── entities/               # User y UserRole
    └── dto/                    # CreateUserDto y UpdateUserDto
```

## Comandos

```bash
npm install
cp .env.example .env     # configurar credenciales de MySQL y JWT_SECRET
npm run seed             # crea el usuario admin de prueba
npm run start:dev        # http://localhost:3000
npm run build            # compila a dist/
```
