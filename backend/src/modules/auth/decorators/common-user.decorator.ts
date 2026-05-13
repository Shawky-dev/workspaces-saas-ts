import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Returns the authenticated common user attached to the current request.
 *
 * The value comes from `CommonAuthGuard` after Passport validates the JWT.
 */
export const CommonUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest()
        return request.user
    },
)
