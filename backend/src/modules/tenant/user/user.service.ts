import { Injectable, Inject } from '@nestjs/common'
import { TENANT_MODEL_REGISTRY } from '@phen0menon/nestjs-mongoose-tenancy'
import type { TenantModelRegistry } from '@phen0menon/nestjs-mongoose-tenancy'
import { TenantRepository } from 'src/public/db/tenant.repository'
import { USER_MODEL_NAME, UserDocument } from './user.schema'
import { CreateUserDto } from './dto/create-user'

@Injectable()
export class UserService extends TenantRepository<UserDocument> {
    constructor(
        @Inject(TENANT_MODEL_REGISTRY)
        modelRegistry: TenantModelRegistry,
    ) {
        super(modelRegistry, USER_MODEL_NAME)
    }

    async createUser(tenantId: string, data: CreateUserDto) {
        return this.createDocument(data, tenantId)
    }

    async findAllUsers(tenantId: string) {
        return this.findAll(tenantId)
    }
    async findByEmail(tenantId: string, email: string) {
        return this.modelFor(tenantId).findOne({ email }).lean() // no throwing
    }
}
