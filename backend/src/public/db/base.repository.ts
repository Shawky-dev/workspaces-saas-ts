import { NotFoundException } from '@nestjs/common'
import { Model, QueryFilter } from 'mongoose'

import { MongoExceptionMapper } from './mongo-exception.mapper'

export abstract class BaseRepository<T> {
    constructor(protected readonly model: Model<T>) { }

    protected async createDocument(data: Partial<T>) {
        try {
            return await this.model.create(data)
        } catch (error) {
            MongoExceptionMapper.map(error)
        }
    }

    protected async findAll() {
        return this.model.find().lean()
    }

    protected async findById(id: string) {
        const document = await this.model.findById(id).lean()

        if (!document) {
            throw new NotFoundException(
                `${this.model.modelName} not found`,
            )
        }

        return document
    }

    protected async findOne(filter: QueryFilter<T>) {
        const document = await this.model.findOne(filter).lean()

        if (!document) {
            throw new NotFoundException(
                `${this.model.modelName} not found`,
            )
        }

        return document
    }
}
