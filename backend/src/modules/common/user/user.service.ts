import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import {
    USER_MODEL_NAME,
    UserDocument,
} from './user.schema'

import { CommonRepository } from 'src/public/db/common.repository'
import { CreateUserDto } from './dto/create-user'
import { UpdateUserDto } from './dto/update-user'
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

    private toPublicUser(user: any) {
        return {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
    }

    async createUser(data: CreateUserDto) {
        const user = await this.createDocument(data)
        return this.toPublicUser(user)
    }

    async findAllUsers() {
        const users = await this.findAll()
        return users.map((user) => this.toPublicUser(user))
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

    async findPublicById(id: string) {
        const user = await super.findById(id)
        return this.toPublicUser(user)
    }

    async updateUser(id: string, data: UpdateUserDto) {
        const model = this.modelFor()
        const user = await model.findById(id)

        if (!user) {
            return super.findById(id)
        }

        user.set(data)
        const savedUser = await user.save()
        return this.toPublicUser(savedUser)
    }

    async deleteUser(id: string) {
        const model = this.modelFor()
        const user = await model.findByIdAndDelete(id).lean()

        if (!user) {
            return super.findById(id)
        }

        return this.toPublicUser(user)
    }
}
