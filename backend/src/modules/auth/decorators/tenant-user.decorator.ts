import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Returns the authenticated tenant user attached to the current request.
 *
 * The value comes from `TenantAuthGuard` after Passport validates the JWT.
 */
export const TenantUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest()
        return request.user
    },
)
