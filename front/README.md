# Front (Angular)

Interfaz sencilla para el login y el manejo de usuarios.

```
src/app/
├── core/                  # servicios, guard e interceptor (compartidos)
│   ├── api.ts             # URL de la API, interfaces y helper de errores
│   ├── auth.service.ts    # login, registro, logout y estado de sesion (signals)
│   ├── auth.guard.ts      # protege las rutas privadas
│   ├── token.interceptor.ts  # agrega el header Authorization
│   └── users.service.ts   # CRUD de usuarios
└── pages/
    ├── login/             # formulario de login
    ├── register/          # formulario de registro
    ├── home/              # perfil del usuario + cerrar sesion
    └── users/             # lista, alta y baja de usuarios (solo admin)
```

## Comandos

```bash
npm install
npm start      # http://localhost:4200
npm run build  # compila para produccion en dist/
```

La URL de la API esta en `src/app/core/api.ts`. El token se guarda en
`localStorage` y el interceptor lo envia en cada peticion.
