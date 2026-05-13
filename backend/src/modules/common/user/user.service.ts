import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import {
    USER_MODEL_NAME,
    UserDocument,
} from './user.schema'

import { CommonRepository } from 'src/public/db/common.repository'
/**
 * Service for managing platform-level users in the **common database**.
 *
 * Extends {@link CommonRepository} so all operations target the shared
 * `MONGO_COMMON_URI` database, not any tenant-specific database.
 */
@Injectable()
export class UserService
    extends CommonRepository<UserDocument> {

    constructor(
        @InjectModel(USER_MODEL_NAME)
        model: Model<UserDocument>,
    ) {
        super(model)
    }

    async createUser(data: Partial<UserDocument>) {
        return this.createDocument(data)
    }

    async findAllUsers() {
        return this.findAll()
    }

    async findByEmail(email: string) {
        return this.findOne({ email })
    }
}
