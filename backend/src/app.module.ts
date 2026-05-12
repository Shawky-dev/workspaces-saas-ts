import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'

import { TenancyModule } from './public/config/tenancy.module'

import { TenantsModule } from './modules/common/tenants/tenant.module'
import { TenantUserModule } from './modules/tenant/user/user.module'
import { CommonUserModule } from './modules/common/user/user.module'
import { TenantBootstrapModule } from './modules/common/tenants/bootstrap/bootstrap.module'

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
    TenantBootstrapModule,
    //_TENANT
    TenantUserModule,
  ],
})
export class AppModule { }
