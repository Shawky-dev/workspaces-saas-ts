import { NotFoundException } from "@nestjs/common"
import { Model, QueryFilter } from "mongoose"

export abstract class BaseRepository<T> {
    protected abstract modelFor(tenantId?: string): Model<T>

    protected async createDocument(data: Partial<T>, tenantId?: string) {
        return this.modelFor(tenantId).create(data)
    }

    protected async findAll(tenantId?: string) {
        return this.modelFor(tenantId).find().lean()
    }

    protected async findById(id: string, tenantId?: string) {
        const model = this.modelFor(tenantId)
        const doc = await model.findById(id).lean()
        if (!doc) throw new NotFoundException(`${model.modelName} not found`)
        return doc
    }

    protected async findOne(filter: QueryFilter<T>, tenantId?: string) {
        const model = this.modelFor(tenantId)
        const doc = await model.findOne(filter).lean()
        if (!doc) throw new NotFoundException(`${model.modelName} not found`)
        return doc
    }
}
