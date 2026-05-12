import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'

import { TenancyModule } from './common/config/tenancy.module'

import { TenantsModule } from './modules/tenant/tenants/tenant.module'

@Module({
  imports: [
    // MASTER / SHARED DATABASE
    MongooseModule.forRoot(
      process.env.MONGO_MASTER_URI!,
    ),

    // TENANT DATABASE SYSTEM
    TenancyModule,

    TenantsModule,
  ],
})
export class AppModule { }
