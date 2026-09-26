import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../../users/entities/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Indica que roles pueden acceder a la ruta. Lo verifica RolesGuard.
 *
 * Uso: @Roles(UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
