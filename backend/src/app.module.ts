import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'

import { TenancyModule } from './common/config/tenancy.module'

import { ProductsModule } from './modules/products/products.module'

import { TenantsModule } from './modules/tenants/tenant.module'

@Module({
  imports: [
    // COMMON / SHARED DATABASE
    MongooseModule.forRoot(
      process.env.MONGO_COMMON_URI!,
    ),

    // TENANT DATABASE SYSTEM
    TenancyModule,

    ProductsModule,

    TenantsModule,
  ],
})
export class AppModule { }
