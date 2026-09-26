/**
 * Roles disponibles. En MySQL se guardan como columnas ENUM.
 * Se agregan aqui si el proyecto necesita mas perfiles.
 */
export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  QUERY = 'query',
}
