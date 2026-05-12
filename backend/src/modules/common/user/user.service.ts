import { Injectable } from '@nestjs/common'

import { InjectModel } from '@nestjs/mongoose'

import { Model } from 'mongoose'

import {
    USER_MODEL_NAME,
    UserDocument,
} from './user.schema'

import { BaseRepository } from 'src/public/db/base.repository'

@Injectable()
export class UserService
    extends BaseRepository<UserDocument> {

    constructor(
        @InjectModel(USER_MODEL_NAME)
        private readonly users: Model<UserDocument>,
    ) {
        super(users)
    }

    async createUser(data: Partial<UserDocument>) {
        return this.createDocument(data)
    }

    async findAllUsers() {
        return this.findAll()
    }
}
