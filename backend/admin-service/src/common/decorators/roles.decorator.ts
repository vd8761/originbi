import { SetMetadata } from '@nestjs/common';

/**
 * Enum defining all possible user roles in the system
 */
export enum UserRole {
    ADMIN = 'ADMIN',
    CORPORATE = 'CORPORATE',
    STUDENT = 'STUDENT',
}

/**
 * Metadata key for storing roles configuration
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * Use this decorator on controller methods to restrict access to specific roles
 * 
 * @example
 * // Only ADMIN can access this endpoint
 * @Roles(UserRole.ADMIN)
 * @Get('all-users')
 * getAllUsers() { ... }
 * 
 * @example
 * // ADMIN and CORPORATE can access this endpoint
 * @Roles(UserRole.ADMIN, UserRole.CORPORATE)
 * @Get('candidates')
 * getCandidates() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
