import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Passport guard for endpoints that require a valid tenant-user JWT.
 *
 * The guard also requires a `:tenantId` route parameter so the strategy can
 * verify the token against the correct workspace context.
 */
@Injectable()
export class TenantAuthGuard extends AuthGuard('jwt-tenant') {
    /**
     * Ensures the request is tenant-scoped before Passport runs JWT validation.
     *
     * @param context - The current HTTP execution context.
     * @returns `false` when the route does not include `tenantId`; otherwise delegates to Passport.
     */
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest()
        const tenantId = request.params.tenantId

        if (!tenantId) {
            return false
        }

        return super.canActivate(context)
    }
}
