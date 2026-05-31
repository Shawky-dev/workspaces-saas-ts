import { Module } from '@nestjs/common'

import { MongooseTenancyModule } from '@phen0menon/nestjs-mongoose-tenancy'

import { CustomerController } from './customer.controller'
import { CustomerService } from './customer.service'

import {
    CUSTOMER_MODEL_NAME,
    CustomerSchema,
} from './customer.schema'

@Module({
    imports: [
        MongooseTenancyModule.forFeature([
            {
                name: CUSTOMER_MODEL_NAME,
                schema: CustomerSchema,
            },
        ]),
    ],

    controllers: [CustomerController],

    providers: [CustomerService],

    exports: [CustomerService],
})
export class CustomerModule {}