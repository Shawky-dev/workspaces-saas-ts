import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class TenantAuthGuard extends AuthGuard('jwt-tenant') {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest()
        const tenantId = request.params.tenantId

        if (!tenantId) {
            return false
        }

        return super.canActivate(context)
    }
}
