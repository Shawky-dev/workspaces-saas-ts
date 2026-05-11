import { Injectable } from '@nestjs/common'
import { InjectTenantModel } from '@phen0menon/nestjs-mongoose-tenancy'
import { Model } from 'mongoose'

import { TENANT_MODEL_NAME, TenantDocument } from './tenant.schema'
import { CreateTenantDto } from './dto/create-tenant'
import { BaseRepository } from 'src/common/db/base.repository'

@Injectable()
export class TenantService extends BaseRepository<TenantDocument> {
    constructor(
        @InjectTenantModel(TENANT_MODEL_NAME)
        private readonly tenantsModel: Model<TenantDocument>,
    ) {
        super(tenantsModel)
    }

    async createTenant(dto: CreateTenantDto) {
        return this.createDocument(dto)
    }

    async getAllTenants() {
        return this.findAll()
    }
    async getTenantBySlug(slug: string) {
        return this.findOne({ slug })
    }
}           
