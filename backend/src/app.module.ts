import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'

import { TenancyModule } from './public/config/tenancy.module'

import { TenantsModule } from './modules/tenant/tenants/tenant.module'
import { TenantUserModule } from './modules/tenant/user/user.module'
import { CommonUserModule } from './modules/common/user/user.module'

@Module({
  imports: [
    //_CONFIG
    // COMMON / SHARED DATABASE
    MongooseModule.forRoot(
      process.env.MONGO_COMMON_URI!,
    ),
    // TENANT DATABASE SYSTEM
    TenancyModule,
    //_COMMON
    TenantsModule,
    CommonUserModule,
    //_TENANT
    TenantUserModule,
  ],
})
export class AppModule { }
