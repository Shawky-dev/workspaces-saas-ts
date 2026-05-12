import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'

import { TenantController } from './tenant.controller'
import { TenantService } from './tenant.service'

import {
    TENANT_MODEL_NAME,
    TenantSchema,
} from './tenant.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: TENANT_MODEL_NAME,
                schema: TenantSchema,
            },
        ]),
    ],

    controllers: [TenantController],

    providers: [TenantService],

    exports: [TenantService],
})
export class TenantsModule { }
