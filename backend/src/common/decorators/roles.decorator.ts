import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator - Marks route handlers with required role(s)
 *
 * @param roles - Array of role names required to access the route
 *
 **/

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
