import { Module } from '@nestjs/common'
import { MongooseTenancyModule } from '@phen0menon/nestjs-mongoose-tenancy'

import { TenantController } from './tenant.controller'
import { TenantService } from './tenant.service'
import { TENANT_MODEL_NAME, TenantSchema } from './tenant.schema'

@Module({
    imports: [
        MongooseTenancyModule.forFeature([
            {
                name: TENANT_MODEL_NAME,
                schema: TenantSchema,
            },
        ]),
    ],
    controllers: [TenantController],
    providers: [TenantService,],
    exports: [TenantService],
})
export class TenantsModule { }
