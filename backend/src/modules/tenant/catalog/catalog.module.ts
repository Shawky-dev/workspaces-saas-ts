import { Module } from '@nestjs/common'
import { MongooseTenancyModule } from '@phen0menon/nestjs-mongoose-tenancy'
import {
    CATALOG_ITEM_MODEL_NAME,
    CatalogItemSchema,
} from './catalog-item.schema'
import { CatalogController } from './catalog.controller'
import { CatalogService } from './catalog.service'

@Module({
    imports: [
        MongooseTenancyModule.forFeature([
            {
                name: CATALOG_ITEM_MODEL_NAME,
                schema: CatalogItemSchema,
            },
        ]),
    ],
    controllers: [CatalogController],
    providers: [CatalogService],
    exports: [CatalogService],
})
export class CatalogModule { }
