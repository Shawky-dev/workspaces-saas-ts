import { NotFoundException } from "@nestjs/common"
import { Model, QueryFilter } from "mongoose"

/**
 * Abstract base class providing generic CRUD operations for Mongoose models.
 *
 * Subclasses must implement {@link BaseRepository.modelFor} to return the correct
 * Mongoose `Model` — either a fixed common-DB model or a per-tenant model resolved
 * from the registry.
 *
 * @typeParam T - The Mongoose document type this repository operates on.
 */
export abstract class BaseRepository<T> {
    /**
     * Resolves the Mongoose `Model` to use for a given operation.
     *
     * - In {@link CommonRepository} this always returns the same injected model.
     * - In {@link TenantRepository} this looks up the model for the given tenant.
     *
     * @param tenantId - The tenant identifier. Required in tenant-scoped repositories,
     *   omitted in common-DB repositories.
     */
    protected abstract modelFor(tenantId?: string): Model<T>
    /**
     * Creates and persists a new document.
     *
     * @param data - Partial document fields to set on the new record.
     * @param tenantId - Required when called from a tenant-scoped repository.
     * @returns The created document.
     */
    protected async createDocument(data: Partial<T>, tenantId?: string) {
        return this.modelFor(tenantId).create(data)
    }
    /**
     * Returns all documents in the collection as plain JS objects.
     *
     * @param tenantId - Required when called from a tenant-scoped repository.
     * @returns Array of lean (plain object) documents.
     */
    protected async findAll(tenantId?: string) {
        return this.modelFor(tenantId).find().lean()
    }
    /**
     * Finds a single document by its MongoDB `_id`.
     *
     * @param id - The MongoDB ObjectId string.
     * @param tenantId - Required when called from a tenant-scoped repository.
     * @returns The matching lean document.
     * @throws {NotFoundException} If no document with that `_id` exists.
     */
    protected async findById(id: string, tenantId?: string) {
        const model = this.modelFor(tenantId)
        const doc = await model.findById(id).lean()
        if (!doc) throw new NotFoundException(`${model.modelName} not found`)
        return doc
    }
    /**
     * Finds a single document matching the given filter.
     *
     * @param filter - A Mongoose query filter object.
     * @param tenantId - Required when called from a tenant-scoped repository.
     * @returns The matching lean document.
     * @throws {NotFoundException} If no document matches the filter.
     */
    protected async findOne(filter: QueryFilter<T>, tenantId?: string) {
        const model = this.modelFor(tenantId)
        const doc = await model.findOne(filter).lean()
        if (!doc) throw new NotFoundException(`${model.modelName} not found`)
        return doc
    }
}
