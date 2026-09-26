# Prueba tecnica - Instituto del Torax

Login y manejo de usuarios con **Node + NestJS + TypeORM + MySQL + JWT** (back) y **Angular** (front).

El proyecto esta dividido en dos carpetas independientes:

```
back/   API REST (NestJS + TypeORM + MySQL + JWT)
front/  Interfaz web (Angular, Forms reactivos + signals)
```

## 1. Requisitos

- Node.js 20 o superior
- MySQL 8 corriendo en `localhost:3306`

## 2. Levantar el back

```bash
cd back
npm install


# Crear el .env con los datos de conexion
cp .env.example .env      

# Crear el usuario administrador inicial
npm run seed

# Levantar la API en 
npm run start:dev
```

La tabla `users` se crea sola al arrancar (TypeORM `synchronize: true`).

## 3. Levantar el front

```bash
cd front
npm install
npm start
```

La app queda en `http://localhost:4200` y consume la API en `http://localhost:3000/api`
(url en `front/src/app/core/api.ts`).

## 4. Usuario de prueba

Creado por `npm run seed` (se puede cambiar en el `.env` del back):

| Correo | Contrasena | Rol |
| --- | --- | --- |
| admin@instituto.com | Admin1234 | admin |

Ademas se puede registrar un usuario normal desde la pantalla de registro.

## 5. Endpoints

| Metodo | Ruta | Descripcion | Acceso |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Registra un usuario (siempre con rol `user`) | Publico |
| POST | `/api/auth/login` | Devuelve `{ accessToken, user }` | Publico |
| GET | `/api/auth/me` | Usuario del token | Autenticado |
| POST | `/api/users` | Crea un usuario (permite elegir rol) | Admin |
| GET | `/api/users` | Lista los usuarios | Admin |
| GET | `/api/users/:id` | Usuario por id | Admin |
| PATCH | `/api/users/:id` | Actualiza nombre, correo, contrasena, rol o estado | Admin |
| DELETE | `/api/users/:id` | Elimina un usuario | Admin |

Las rutas protegidas se consumen con la cabecera:

```
Authorization: Bearer <accessToken>
```

## 6. Decisiones del back

- **Contrasenas**: se guardan con hash `bcrypt` (nunca en texto plano). La columna
  `password` tiene `select: false` y ademas `@Exclude()`, de modo que el hash no sale
  en ninguna respuesta.
- **Autenticacion**: `JwtAuthGuard` registrado como guard global con `APP_GUARD`, por
  lo que todas las rutas exigen token salvo las marcadas con `@Public()`.
- **Autorizacion**: `RolesGuard` (tambien global) valida el decorador `@Roles(...)`.
- **Validacion**: `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`, los
  DTOs se validan con `class-validator`.
- **Errores**: se usan las excepciones de Nest (`UnauthorizedException`,
  `ForbiddenException`, `ConflictException`, `NotFoundException`), que ya se traducen
  a respuestas HTTP correctas.
