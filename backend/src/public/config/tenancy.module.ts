import { Module } from '@nestjs/common'
import {
    MongooseTenancyModule,
    fromHeader,
    fromRequest,
} from '@phen0menon/nestjs-mongoose-tenancy'

const getTenants = async ({ commonConnection }) => {
    const docs = await commonConnection
        .collection('tenants')
        .find({})
        .toArray()
    console.log(docs)
    return docs.map(t => ({ id: t.slug, uri: t.mongoUri }))
}

@Module({
    imports: [
        MongooseTenancyModule.forRoot({
            common: {
                uri: process.env.MONGO_COMMON_URI!,
            },

            tenants: getTenants,

            tenantResolver: fromRequest((req: any) => req.params.tenantId),
        }),
    ],

    exports: [MongooseTenancyModule],
})


export class TenancyModule { }
