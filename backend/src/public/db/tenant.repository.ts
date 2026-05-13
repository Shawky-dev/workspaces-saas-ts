import { Inject } from '@nestjs/common'
import { TENANT_MODEL_REGISTRY } from '@phen0menon/nestjs-mongoose-tenancy'
import { Model } from 'mongoose'
import { BaseRepository } from './base.repository'
import type { TenantModelRegistry } from '@phen0menon/nestjs-mongoose-tenancy'
/**
 * Repository base class for collections stored in a **per-tenant database**.
 *
 * Extends {@link BaseRepository} by resolving the correct Mongoose `Model` at
 * runtime from the `TenantModelRegistry`, which maps each `tenantId` to its
 * own database connection. Every method call must supply a `tenantId`.
 *
 * @typeParam T - The Mongoose document type this repository operates on.
 *
 * @example
 * ```ts
 * @Injectable()
 * export class UserService extends TenantRepository<UserDocument> {
 *   constructor(@Inject(TENANT_MODEL_REGISTRY) registry: TenantModelRegistry) {
 *     super(registry, USER_MODEL_NAME)
 *   }
 * }
 * ```
 */
export abstract class TenantRepository<T> extends BaseRepository<T> {
    /**
     * @param modelRegistry - The registry provided by `TenancyModule` that holds
     *   one Mongoose `Model` per connected tenant.
     * @param tenantModelName - The Mongoose model name to look up in the registry
     *   (e.g. `User.name`).
     */
    constructor(
        @Inject(TENANT_MODEL_REGISTRY)
        private readonly modelRegistry: TenantModelRegistry,
        private readonly tenantModelName: string,
    ) {
        super()
    }
    /**
     * Resolves the Mongoose `Model` for the given tenant.
     *
     * Calls `getModelMap()` on every invocation so that newly connected tenants
     * are always visible without a restart.
     *
     * @param tenantId - The tenant identifier (matches the `:tenantId` route param).
     * @throws {Error} If no model is registered for the given `tenantId`, which
     *   typically means the tenant does not exist or has not been bootstrapped.
     */
    protected modelFor(tenantId: string): Model<T> {
        const model = this.modelRegistry.getModelMap<T>(this.tenantModelName).get(tenantId)
        if (!model) throw new Error(`No model for tenant "${tenantId}"`)
        return model
    }
}
