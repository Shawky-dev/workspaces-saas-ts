import { Module } from '@nestjs/common'
import {
    MongooseTenancyModule,
    fromHeader,
} from '@phen0menon/nestjs-mongoose-tenancy'

@Module({
    imports: [
        MongooseTenancyModule.forRoot({
            common: {
                uri: process.env.MONGO_COMMON_URI!,
            },

            tenants: [
                {
                    id: 'org-1',
                    uri: process.env.MONGO_ORG1_URI!,
                },
            ],

            tenantResolver: fromHeader('x-tenant-id'),
        }),
    ],

    exports: [MongooseTenancyModule],
})
export class TenancyModule { }
