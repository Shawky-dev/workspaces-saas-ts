import { Injectable, Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { TENANT_CONNECTION_REGISTRY } from '@phen0menon/nestjs-mongoose-tenancy'
import { Model } from 'mongoose'

import { TENANT_MODEL_NAME, TenantDocument } from './tenant.schema'
import { CreateTenantDto } from './dto/create-tenant'
import { BaseRepository } from 'src/public/db/base.repository'

@Injectable()
export class TenantService extends BaseRepository<TenantDocument> {
    constructor(
        @InjectModel(TENANT_MODEL_NAME)
        private readonly tenantsModel: Model<TenantDocument>,

        //inject the registry using its string token  
        @Inject(TENANT_CONNECTION_REGISTRY)
        private readonly connectionRegistry: any,
    ) {
        super(tenantsModel)
    }

    async createTenant(dto: CreateTenantDto) {
        const mongoUri = `${process.env.MONGO_BASE_URI}/${dto.slug}`

        const tenant = await this.createDocument({ ...dto, mongoUri })

        // guard against duplicate connections since libary cant add tenancy at runtime safely need to add garuds 
        if (!this.connectionRegistry.hasTenant(dto.slug)) {
            await this.connectionRegistry.connectTenant({ id: dto.slug, uri: mongoUri })
            this.connectionRegistry.tenantConnections.push({ id: dto.slug, uri: mongoUri })
        }

        return tenant
    }

    async getAllTenants() {
        return this.findAll()
    }

    async getTenantBySlug(slug: string) {
        return this.findOne({ slug })
    }
}
