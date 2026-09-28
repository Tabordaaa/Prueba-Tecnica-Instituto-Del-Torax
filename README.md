# Prueba tecnica - Instituto del Torax - Login_auth

## Descripción

Sistema de gestión de usuarios con autenticación JWT, control de acceso basado en roles (RBAC) y proceso ETL para carga de datos desde archivos CSV.

## Características

- Autenticación con JWT
- Roles: Administrador, Operador, Consulta
- Gestión de usuarios (CRUD)
- Carga y procesamiento ETL de archivos CSV
- Manejo de errores y registros duplicados

## Roles y permisos

| Vista | Admin | Operador | Consulta |
|-------|:-----:|:--------:|:--------:|
| Dashboard | ✅ | ✅ | ✅ |
| Usuarios | ✅ | ❌ | ❌ |
| Cargar Archivos | ✅ | ✅ | ❌ |
| Procesar ETL | ✅ | ✅ | ❌ |
| Consultar Registros | ✅ | ✅ | ✅ |
| Consultar Errores | ✅ | ✅ | ✅ |
| Reportes | ✅ | ✅ | ✅ |

## Proceso ETL

### Columnas requeridas

| Columna | Descripción |
|---------|-------------|
| tipo_documento | CC, CE, TI |
| documento | Solo caracteres numéricos |
| nombres | Obligatorio |
| apellidos | Obligatorio |
| fecha_nacimiento | Formato YYYY-MM-DD |
| email | Formato válido |
| ciudad | Obligatorio |
| estado | ACTIVO o INACTIVO |

### Estrategia de duplicados

**El documento identifica de manera única al usuario.**

La detección de duplicados se realiza en dos niveles:

1. **Dentro del archivo**: Se utiliza un `Set` para detectar documentos repetidos dentro del mismo archivo CSV. Si un documento aparece más de una vez, se registra como error.

2. **Contra la base de datos**: Antes de insertar cada registro válido, se verifica si el documento ya existe en la base de datos. Si existe, se omite la inserción y se cuenta como duplicado.

### Manejo de errores

- Los registros inválidos no detienen el proceso
- Se procesan todos los registros válidos
- Los errores se almacenan con: número de fila, campo, valor recibido y descripción del error

### Información de importación

Cada importación registra:
- Nombre del archivo de origen
- Fecha de importación
- Usuario que realizó la carga
- Totales: registros totales, válidos, inválidos, duplicados, importados

## Usuarios de prueba

| Usuario | Correo | Contraseña | Rol |
|---------|--------|------------|-----|
| Admin | admin@instituto.com | Admin1234 | Administrador |
| Operador | operador@instituto.com | Operador1234 | Operador |
| Consulta | consulta@instituto.com | Consulta1234 | Consulta |

## Requisitos

- Node.js 18+
- MySQL 8+

## Instalación

### Backend

```bash
cd back
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npm run seed
npm run start:dev
```

### Frontend

```bash
cd front
npm install
npm run build
# o para desarrollo
ng serve
```

## Estructura del proyecto

```
├── back/                 # Backend NestJS
│   └── src/
│       ├── auth/         # Autenticación y guards
│       ├── users/        # Gestión de usuarios
│       └── etl/          # Proceso ETL
├── front/                # Frontend Angular
│   └── src/app/
│       ├── core/         # Servicios y guards
│       └── pages/        # Componentes de vistas
└── README.md
```
