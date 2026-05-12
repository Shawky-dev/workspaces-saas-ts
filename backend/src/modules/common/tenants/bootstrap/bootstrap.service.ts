import { Inject, Injectable } from '@nestjs/common'
import { TENANT_MODEL_REGISTRY } from '@phen0menon/nestjs-mongoose-tenancy'
import { ITenantBootstrapper, TENANT_BOOTSTRAPPERS, TenantBootstrapPayload } from './bootstrap.interface'

@Injectable()
export class TenantBootstrapService {
    constructor(
        @Inject(TENANT_BOOTSTRAPPERS)
        private readonly bootstrappers: ITenantBootstrapper[],

    ) { }

    async run(tenantId: string, payload?: TenantBootstrapPayload): Promise<void> {
        for (const bootstrapper of this.bootstrappers) {
            await bootstrapper.run(tenantId, payload)
        }
    }
}
