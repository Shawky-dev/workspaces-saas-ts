import { TenantModelRegistry } from '@phen0menon/nestjs-mongoose-tenancy'

import { UserBootstrapPayload } from 'src/modules/tenant/user/user.bootstrapper'

export interface TenantBootstrapPayload {
    user?: UserBootstrapPayload
}

export interface ITenantBootstrapper {
    run(
        tenantId: string,
        payload?: TenantBootstrapPayload,
    ): Promise<void>
}

export const TENANT_BOOTSTRAPPERS = Symbol('TENANT_BOOTSTRAPPERS')
