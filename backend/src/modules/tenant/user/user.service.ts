import { Injectable, Inject } from '@nestjs/common'
import { TENANT_MODEL_REGISTRY } from '@phen0menon/nestjs-mongoose-tenancy'
import type { TenantModelRegistry } from '@phen0menon/nestjs-mongoose-tenancy'
import { TenantRepository } from 'src/public/db/tenant.repository'
import { USER_MODEL_NAME, UserDocument } from './user.schema'
import { CreateUserDto } from './dto/create-user'
import { UpdateUserDto } from './dto/update-user'
import { Role } from '../../auth/enums/role.enum'

/**
 * Service for managing users within a **specific tenant's database**.
 *
 * Extends {@link TenantRepository} — every method requires a `tenantId` to
 * route the query to the correct workspace database via the `TenantModelRegistry`.
 */
@Injectable()
export class UserService extends TenantRepository<UserDocument> {
    constructor(
        @Inject(TENANT_MODEL_REGISTRY)
        modelRegistry: TenantModelRegistry,
    ) {
        super(modelRegistry, USER_MODEL_NAME)
    }

    async createUser(tenantId: string, data: CreateUserDto) {
        const user = await this.createDocument({...data, roles: [Role.USER],}, tenantId)
        return this.toPublicUser(user)
    }

    async findAllUsers(tenantId: string) {
        const users = await this.findAll(tenantId)
        return users.map((user) => this.toPublicUser(user))
    }

    private toPublicUser(user: any) {
        return {
            id: user._id,
            email: user.email,
            name: user.name,
            roles: user.roles,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
    }

    /**
     * Finds a tenant user by email. Returns `null` if not found (does NOT throw).
     * Used during bootstrapping to avoid duplicate admin creation.
     * @param tenantId - The tenant identifier.
     * @param email - The email to search for.
     * @returns The lean `UserDocument` or `null`.
     */
    async findByEmail(tenantId: string, email: string) {
        return this.modelFor(tenantId).findOne({ email }).lean() // no throwing
    }

    async findPublicById(tenantId: string, id: string) {
        const user = await super.findById(id, tenantId)
        return this.toPublicUser(user)
    }

    async updateUser(tenantId: string, id: string, data: UpdateUserDto) {
        const model = this.modelFor(tenantId)
        const user = await model.findById(id)

        if (!user) {
            return super.findById(id, tenantId)
        }

        user.set(data)
        const savedUser = await user.save()
        return this.toPublicUser(savedUser)
    }

    async deleteUser(tenantId: string, id: string) {
        const model = this.modelFor(tenantId)
        const user = await model.findByIdAndDelete(id).lean()

        if (!user) {
            return super.findById(id, tenantId)
        }

        return this.toPublicUser(user)
    }
}
