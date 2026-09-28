# Prueba Técnica - Instituto del Torax

## 1. Descripción

Sistema de gestión de usuarios con autenticación JWT, control de acceso basado en roles (RBAC) y proceso ETL para carga y procesamiento de datos desde archivos CSV.

El sistema permite:
- Autenticación de usuarios con tokens JWT
- Gestión de usuarios (CRUD) con roles: Administrador, Operador y Consulta
- Carga y procesamiento ETL de archivos CSV
- Consulta de registros importados con paginación y filtros
- Consulta de errores de importación
- Reportes y dashboard con estadísticas

## 2. Tecnologías

### Backend
- **NestJS** 10.x - Framework de Node.js
- **TypeScript** 5.x - Lenguaje de programación
- **TypeORM** 0.3.x - ORM para base de datos
- **MySQL** 8.x - Base de datos relacional
- **JWT** (jsonwebtoken) - Autenticación
- **bcryptjs** - Hash de contraseñas
- **class-validator** - Validación de DTOs
- **Swagger** (@nestjs/swagger) - Documentación interactiva de la API en `/docs`

### Frontend
- **Angular** 17.x - Framework de frontend
- **TypeScript** 5.x - Lenguaje de programación
- **RxJS** 7.x - Programación reactiva
- **Angular Forms** - Formularios reactivos

## 3. Requisitos

- **Node.js** 18.x o superior
- **npm** 9.x o superior
- **MySQL** 8.x o superior

## 4. Instalación

### Backend
```bash
cd back
npm install
```

### Frontend
```bash
cd front
npm install
```

## 5. Configuración

### Variables de entorno (back/.env)

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=123456
DB_NAME=instituto_del_torax

JWT_SECRET=clave-de-desarrollo-cambiar-en-produccion
JWT_EXPIRES_IN=3600

BCRYPT_SALT_ROUNDS=10

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@instituto.com
ADMIN_PASS=Admin1234

OPERATOR_NAME=Operador
OPERATOR_EMAIL=operador@instituto.com
OPERATOR_PASS=Operador1234

QUERY_NAME=Consulta
QUERY_EMAIL=consulta@instituto.com
QUERY_PASS=Consulta1234
```

## 6. Base de datos

### Crear la base de datos en MySQL

```sql
CREATE DATABASE instituto_del_torax;
```

### Crear las tablas

Las tablas se crean automáticamente al iniciar el backend gracias a `synchronize: true` en TypeORM.

Tablas creadas:
- `users` - Usuarios del sistema
- `people` - Registros importados desde CSV
- `import_records` - Historial de importaciones
- `import_errors` - Errores de importación

## 7. Ejecución

### Backend
```bash
cd back
npm run seed --> crea los usuarios de prueba en la base de datos.
npm run start:dev
```

El backend estará disponible en `http://localhost:3000`

La documentación interactiva de la API (Swagger UI) queda disponible en
`http://localhost:3000/docs` y el JSON OpenAPI en `http://localhost:3000/docs-json`.
Para probar las rutas protegidas desde el navegador: ejecutar el login, copiar el
`accessToken`, click en **Authorize**, pegarlo y confirmar.

### Frontend
```bash
cd front
npm start
```

El frontend estará disponible en `http://localhost:4200`

## 8. Usuarios de prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| **ADMIN** | admin@instituto.com | Admin1234 |
| **OPERADOR** | operador@instituto.com | Operador1234 |
| **CONSULTA** | consulta@instituto.com | Consulta1234 |



## 9. Pruebas


### Verificación manual de la API
Independientemente de las pruebas automatizadas, todos los endpoints se pueden
ejercitar desde **Swagger UI** en `http://localhost:3000/docs` (ver la sección
*Documentación de la API con Swagger*). Es la forma más rápida de comprobar
autenticación, validaciones y códigos de error.

## 10. Decisiones técnicas

### Arquitectura

**Backend (NestJS):**
- Arquitectura modular con módulos separados: `auth`, `users`, `etl`
- Uso de guards globales para autenticación y autorización
- Repositorios de TypeORM para acceso a datos
- DTOs con validación usando `class-validator`

**Frontend (Angular):**
- Componentes standalone
- Signals para estado reactivo
- Guards de rutas para protección de vistas
- Servicios inyectados con `inject()`

### Manejo de autenticación

- **JWT (JSON Web Tokens)** para autenticación stateless
- Token con expiración de 1 hora (`JWT_EXPIRES_IN=3600`)
- Guard `JwtAuthGuard` global que verifica el token en cada petición
- Contraseñas hasheadas con bcrypt (10 rondas)

### Manejo de roles

- Tres roles: `admin`, `operator`, `query`
- Decorador `@Roles()` para restringir acceso a rutas
- Guard `RolesGuard` global que verifica los roles
- Permisos definidos en el frontend con `ROLE_PERMISSIONS`

### Implementación del 404 para recursos restringidos

- **Backend:** `RolesGuard` devuelve `NotFoundException` (404) en lugar de `ForbiddenException` (403)
- **Frontend:** `permissionGuard` redirige a `/not-found` cuando el usuario no tiene permiso
- **Rutas:** El wildcard `**` redirige a `dashboard` para que la vista principal sea siempre accesible

### Estrategia para registros duplicados

- **En el archivo:** Se usa un `Set` para detectar documentos repetidos dentro del mismo CSV
- **En la base de datos:** Se verifica si el documento ya existe antes de insertar
- **Restricción única:** La tabla `people` tiene una restricción única en el campo `documento`

### Manejo de errores del ETL

- Los registros inválidos no detienen el proceso
- Se procesan todos los registros válidos
- Los errores se almacenan en la tabla `import_errors` con:
  - Número de fila
  - Campo con error
  - Valor recibido
  - Descripción del error
- Se muestra un resumen con total, válidos, inválidos y duplicados

### Eliminación de la vista "Procesar ETL"

**Decisión:** Se eliminó la vista separada "Procesar ETL" y se unificó con la vista "Cargar Archivos".

**Razones:**

1. **Flujo de usuario más natural:** El usuario no necesita navegar entre vistas para cargar y procesar un archivo. Todo el proceso (carga → validación → procesamiento) ocurre en una sola vista.

2. **Mejor experiencia de usuario:** Al estar todo en una sola vista, el usuario puede ver el progreso del proceso sin cambiar de página.

3. **Código más simple:** Al eliminar una vista, se reduce la complejidad del enrutamiento y se elimina la necesidad de compartir estado entre vistas.

4. **Consistencia con otras vistas:** La vista "Cargar Archivos" ahora incluye todo el flujo del ETL, lo que la hace más completa y útil para el usuario.

**Implementación:**
- La vista "Cargar Archivos" (`/upload`) ahora incluye:
  - Zona de subida de archivos
  - Validación previa del archivo
  - Botón para procesar el ETL
  - Resumen de validación
  - Resultados del proceso ETL
  - Tabla de errores con paginación

### Documentación de la API con Swagger

La API se documenta con **Swagger UI** (`@nestjs/swagger`). Al levantar el backend queda
disponible en `http://localhost:3000/docs` y el JSON OpenAPI en
`http://localhost:3000/docs-json`.

**Plugin de compilación** (`back/nest-cli.json`):

```json
"plugins": [
  {
    "name": "@nestjs/swagger",
    "options": {
      "classValidatorShim": true,
      "introspectComments": true
    }
  }
]
```

- `classValidatorShim`: los campos `required`, `minLength` y los patrones de los DTOs se
  toman automáticamente de las reglas de `class-validator`, de modo que la documentación
  nunca queda desincronizada de la validación real.
- `introspectComments`: los comentarios JSDoc de cada método se convierten en la
  descripción del endpoint, por lo que no es necesario escribir un `@ApiOperation`
  en cada ruta.

**Configuración** (`back/src/main.ts`):

- `DocumentBuilder` con título, versión y descripción de la API.
- `.addTag(...)` para las tres secciones: `auth`, `usuarios` y `etl`.
- `.addBearerAuth(...)` habilita el botón **Authorize** para probar las rutas protegidas.
- `SwaggerModule.setup('docs', ...)` publica la interfaz, con
  `persistAuthorization` para no perder el token al recargar la página.

**Anotaciones usadas en los controladores:**

| Anotación | Para qué sirve |
|---|---|
| `@ApiTags('auth')` | Agrupa los endpoints en secciones de la interfaz |
| `@ApiBearerAuth()` | Indica que la ruta exige token (icono de candado) |
| `@ApiResponse({ status, description, type })` | Documenta cada código de respuesta posible |
| `@ApiParam()` | Describe los parámetros de ruta, por ejemplo `/users/{id}` |
| `@ApiConsumes()` + `@ApiBody()` | Permite seleccionar y enviar el archivo CSV desde la UI |
| `@ApiHideProperty` | Oculta el campo `password` del esquema `User` |

**Cómo se usa:**

1. En `/docs` se ejecuta `POST /api/auth/login` con un usuario de prueba.
2. Se copia el `accessToken` de la respuesta.
3. Se pulsa **Authorize**, se pega el token y se confirma.
4. A partir de ese momento todas las rutas protegidas se pueden ejecutar
   directamente desde el navegador.

**Endpoints documentados por sección:**

| Sección | Endpoints |
|---|---|
| `auth` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| `usuarios` | `POST/GET /api/users`, `GET/PATCH/DELETE /api/users/{id}` |
| `etl` | `POST /api/etl/upload`, `GET /api/etl/dashboard`, `history`, `errors`, `errors/files`, `errors/{importId}`, `people` y los reportes |

**Seguridad de la documentación:**

- `password` tiene `@ApiHideProperty` además de `@Exclude()` y `select: false`, por lo
  que el hash no aparece ni en las respuestas de la API ni en el esquema documentado.
- La respuesta del login se documenta con `LoginResponseDto`
  (`back/src/auth/dto/login-response.dto.ts`), que expone `accessToken` y el usuario
  sin el campo `password`.

### Estructura del proyecto

```
├── back/                     # Backend NestJS
│   └── src/
│       ├── auth/             # Autenticación y guards
│       ├── users/            # Gestión de usuarios
│       ├── etl/              # Proceso ETL
│       └── config/           # Configuración
├── front/                    # Frontend Angular
│   └── src/app/
│       ├── core/             # Servicios y guards
│       └── pages/            # Componentes de vistas
└── README.md
```
.