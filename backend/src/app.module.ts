import { Module } from '@nestjs/common'

import { TenancyModule } from './common/config/tenancy.module'
import { ProductsModule } from './modules/products/products.module'
import { TenantsModule } from './modules/tenants/tenant.module'

@Module({
  imports: [
    TenancyModule,
    ProductsModule,
    TenantsModule
  ],
})
export class AppModule { }
