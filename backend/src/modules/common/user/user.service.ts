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
 *
 * This service is the lookup source used by the common JWT login flow and the
 * `jwt-common` Passport strategy.
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

    /**
     * Finds a common user by email.
     *
     * @param email - The user's email address.
     * @returns The matching user or throws if no document exists.
     */
    async findByEmail(email: string) {
        return this.findOne({ email })
    }

    /**
     * Finds a common user by MongoDB id.
     *
     * @param id - The MongoDB ObjectId string.
     * @returns The matching user or throws if no document exists.
     */
    async findById(id: string) {
        return super.findById(id)
    }
}
