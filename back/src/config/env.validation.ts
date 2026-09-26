/**
 * Validacion de las variables de entorno (.env).
 *
 * Se ejecuta al arrancar la aplicacion. Si falta alguna variable obligatoria
 * la app no levanta y muestra un error claro en consola, en lugar de fallar
 * mas tarde con un error dificil de entender (por ejemplo al conectar a MySQL).
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  // DB_PASS puede ir vacia (por ejemplo, root sin clave en local), por eso no se valida
  const requiredKeys = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

  const missing = requiredKeys.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno en el archivo .env: ${missing.join(', ')}. ` +
        'Revisa el archivo .env.example.',
    );
  }

  return config;
}
