import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'

import {
    USER_MODEL_NAME,
    UserSchema,
} from './user.schema'

import { UserService } from './user.service'

import { UserController } from './user.controller'
import { MongooseTenancyModule } from '@phen0menon/nestjs-mongoose-tenancy'

@Module({
    imports: [
        MongooseTenancyModule.forFeature([
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
export class TenantUserModule { }
