import { Module, Type } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseTenancyModule, fromHeader } from '@phen0menon/nestjs-mongoose-tenancy'

import { ProductController } from './product.controller'
import { PRODUCT_MODEL_NAME, ProductSchema } from './product.schema'
import { ProductService } from './product.service'
import { ProductSeederService } from './product-seeder.service'

interface RealwordExampleModuleOptions {
  commonUri: string
  orgOneUri: string
}

export function createAppModule({ commonUri, orgOneUri }: RealwordExampleModuleOptions): Type<unknown> {
  @Module({
    imports: [
      MongooseTenancyModule.forRoot({
        common: { uri: commonUri },
        tenants: [{ id: 'org-1', uri: orgOneUri }],
        tenantResolver: fromHeader('x-tenant-id'),
      }),
      MongooseTenancyModule.forFeature([{ name: PRODUCT_MODEL_NAME, schema: ProductSchema }]),
    ],
    controllers: [ProductController],
    providers: [ProductSeederService, ProductService],
  })
  class AppModule { }

  return AppModule
}
