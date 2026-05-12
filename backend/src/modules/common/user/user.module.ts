import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'

import {
    USER_MODEL_NAME,
    UserSchema,
} from './user.schema'

import { UserService } from './user.service'

import { UserController } from './user.controller'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: USER_MODEL_NAME,
                schema: UserSchema,
            },
        ]),
    ],

    controllers: [UserController],

    providers: [UserService],

    exports: [UserService],
})
export class CommonUserModule { }
