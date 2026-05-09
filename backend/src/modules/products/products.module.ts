import { Module } from '@nestjs/common'
import { MongooseTenancyModule } from '@phen0menon/nestjs-mongoose-tenancy'

import { ProductController } from './product.controller'
import { ProductService } from './product.service'
import { ProductSeederService } from './product-seeder.service'
import { PRODUCT_MODEL_NAME, ProductSchema } from './product.schema'

@Module({
    imports: [
        MongooseTenancyModule.forFeature([
            {
                name: PRODUCT_MODEL_NAME,
                schema: ProductSchema,
            },
        ]),
    ],
    controllers: [ProductController],
    providers: [ProductService, ProductSeederService],
    exports: [ProductService],
})
export class ProductsModule { }
