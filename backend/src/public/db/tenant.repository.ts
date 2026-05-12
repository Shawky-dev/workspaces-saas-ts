import { Inject } from '@nestjs/common'
import { TENANT_MODEL_REGISTRY } from '@phen0menon/nestjs-mongoose-tenancy'
import { Model } from 'mongoose'
import { BaseRepository } from './base.repository'
import type { TenantModelRegistry } from '@phen0menon/nestjs-mongoose-tenancy'

export abstract class TenantRepository<T> extends BaseRepository<T> {
    constructor(
        @Inject(TENANT_MODEL_REGISTRY)
        private readonly modelRegistry: TenantModelRegistry,
        private readonly tenantModelName: string,
    ) {
        super()
    }

    protected modelFor(tenantId: string): Model<T> {
        // getModelMap() triggers syncModelMap() on every call,  
        // so newly connected tenants are always visible  
        const model = this.modelRegistry.getModelMap<T>(this.tenantModelName).get(tenantId)
        if (!model) throw new Error(`No model for tenant "${tenantId}"`)
        return model
    }
}
