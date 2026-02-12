import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator';

/**
 * RolesGuard
 * A NestJS guard that checks if the current user has the required role(s)
 * to access the protected resource.
 * 
 * @example
 * // Apply globally in main.ts
 * app.useGlobalGuards(new RolesGuard(new Reflector()));
 * 
 * @example
 * // Apply to specific controller
 * @UseGuards(RolesGuard)
 * @Controller('admin')
 * export class AdminController { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
    private readonly logger = new Logger(RolesGuard.name);

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Get required roles from decorator metadata
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are specified, allow access (public endpoint)
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Get user from request
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Check if user exists
        if (!user) {
            this.logger.warn('Access denied: No user in request');
            throw new ForbiddenException('Authentication required');
        }

        // Check if user has required role
        const hasRole = requiredRoles.some((role) => user.role === role);

        if (!hasRole) {
            this.logger.warn(
                `Access denied: User ${user.id} with role ${user.role} attempted to access resource requiring ${requiredRoles.join(', ')}`
            );
            throw new ForbiddenException(
                `Insufficient permissions. Required: ${requiredRoles.join(' or ')}`
            );
        }

        this.logger.debug(`Access granted: User ${user.id} with role ${user.role}`);
        return true;
    }
}
