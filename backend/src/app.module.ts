import { Module } from '@nestjs/common'

import { TenancyModule } from './infra/db/tenancy.module'
import { ProductsModule } from './modules/products/products.module'

@Module({
  imports: [
    TenancyModule,
    ProductsModule,
  ],
})
export class AppModule { }
