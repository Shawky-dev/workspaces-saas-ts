import { Module } from '@nestjs/common'
import {
    MongooseTenancyModule,
    fromHeader,
} from '@phen0menon/nestjs-mongoose-tenancy'

const getTenants = async ({ commonConnection }) => {
    const docs = await commonConnection
        .collection('tenants')
        .find({})
        .toArray()
    return docs.map(t => ({ id: t.slug, uri: t.mongoUri }))
}

@Module({
    imports: [
        MongooseTenancyModule.forRoot({
            common: {
                uri: process.env.MONGO_MASTER_URI!,
            },

            tenants: getTenants,

            tenantResolver: fromHeader('x-tenant-id'),
        }),
    ],

    exports: [MongooseTenancyModule],
})


export class TenancyModule { }
