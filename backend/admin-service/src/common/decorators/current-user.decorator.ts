import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserContext } from '../interfaces/user-context.interface';

/**
 * CurrentUser Decorator
 * Extracts the authenticated user from the request object
 * 
 * @example
 * // Get the full user context
 * @Get('profile')
 * getProfile(@CurrentUser() user: UserContext) {
 *     return user;
 * }
 * 
 * @example
 * // Get a specific property
 * @Get('my-id')
 * getMyId(@CurrentUser('id') userId: number) {
 *     return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
    (data: keyof UserContext | undefined, ctx: ExecutionContext): unknown => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as UserContext;

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        // If a specific property is requested, return only that
        if (data) {
            return user[data];
        }

        return user;
    },
);
