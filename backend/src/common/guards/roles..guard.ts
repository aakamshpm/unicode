/**
 * RolesGuard
 *
 * Checks if the authenticated user has one of the required roles
 * specified by the @Roles() decorator.
 *
 * Prerequisites:
 * - Must run AFTER JwtAuthGuard (requires req.user to be populated)
 * - Route must have @Roles() decorator for role enforcement
 *
 * Execution Flow:
 * 1. Extract required roles from @Roles() decorator metadata
 * 2. If no roles specified, allow access (public route)
 * 3. Retrieve user from request (populated by JwtAuthGuard)
 * 4. Verify user has an assigned role
 * 5. Check if user's role matches any required role
 * 6. Grant/deny access based on role match
 *
 * @throws ForbiddenException - When user lacks required role (403)
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UsersService } from 'src/modules/users/users.service';
import { AuthenticatedRequest } from '../interfaces/auth-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    /* Extract required roles from the decorator */
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // if roles not found, then route doesnt require role check (public route)
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // Fetch user details from http request
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const jwtPayload = request.user;

    if (!jwtPayload)
      throw new ForbiddenException(
        'Authentication required. Ensure JwtAuthGuard runs before RolesGuard.',
      );

    // Fetch full user with role relation from DB (if perfomance issue persist, switch to storing role details from JWT statgery itself)
    const user = await this.usersService.findById(jwtPayload.userId);

    if (!user) throw new ForbiddenException('User not found');

    const userRole = user.role?.name;

    if (!userRole) throw new ForbiddenException('User has no assigned role');

    const hasRequiredRole = requiredRoles.includes(userRole);

    if (!hasRequiredRole)
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${userRole}`,
      );

    return true;
  }
}
