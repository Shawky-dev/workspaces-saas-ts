import { Injectable, Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { TENANT_CONNECTION_REGISTRY } from '@phen0menon/nestjs-mongoose-tenancy'
import { Model } from 'mongoose'

import { TENANT_MODEL_NAME, TenantDocument } from './tenant.schema'
import { CreateTenantDto } from './dto/create-tenant'
import { TenantBootstrapService } from './bootstrap/bootstrap.service'
import { CreateUserDto } from 'src/modules/tenant/user/dto/create-user'
import { CommonRepository } from 'src/public/db/common.repository'
import { TenantBootstrapPayload } from './bootstrap/bootstrap.interface'
import { UserBootstrapPayload } from 'src/modules/tenant/user/user.bootstrapper'
import { UpdateTenantDto } from './dto/update-tenant'


@Injectable()
export class TenantService extends CommonRepository<TenantDocument> {
    constructor(
        @Inject(TENANT_CONNECTION_REGISTRY)
        private readonly connectionRegistry: any,

        private readonly bootstrapService: TenantBootstrapService,
        @InjectModel(TENANT_MODEL_NAME) model: Model<TenantDocument>
    ) {
        super(model)
    }

    async createTenant(dto: CreateTenantDto) {
        const mongoUri = `${process.env.MONGO_BASE_URI}/${dto.slug}`

        const tenant = await this.createDocument({ ...dto, mongoUri })

        // guard against duplicate connections
        if (!this.connectionRegistry.hasTenant(dto.slug)) {
            await this.connectionRegistry.connectTenant({
                id: dto.slug,
                uri: mongoUri,
            })

            this.connectionRegistry.tenantConnections.push({
                id: dto.slug,
                uri: mongoUri,
            })
        }
        let userDTO: CreateUserDto = {
            email: dto.adminEmail,
            name: dto.adminName,
            password: dto.adminPassword,
        }
        let userPayload: UserBootstrapPayload = {
            admin: userDTO
        }
        let payload: TenantBootstrapPayload = {
            user: userPayload
        }
        await this.bootstrapService.run(dto.slug, payload)

        return tenant
    }

    async getAllTenants() {
        return this.findAll()
    }

    async getTenantBySlug(slug: string) {
        return this.findOne({ slug })
    }

    async updateTenant(slug: string, dto: UpdateTenantDto) {
        const tenant = await this.modelFor()
            .findOneAndUpdate({ slug }, dto, { new: true })
            .lean()

        if (!tenant) {
            return this.getTenantBySlug(slug)
        }

        return tenant
    }

    async deleteTenant(slug: string) {
        const tenant = await this.modelFor()
            .findOneAndDelete({ slug })
            .lean()

        if (!tenant) {
            return this.getTenantBySlug(slug)
        }

        return tenant
    }
}
