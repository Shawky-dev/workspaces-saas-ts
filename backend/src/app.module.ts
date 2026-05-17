import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'

import { TenancyModule } from './public/config/tenancy.module'

import { TenantsModule } from './modules/common/tenants/tenant.module'
import { TenantUserModule } from './modules/tenant/user/user.module'
import { CommonUserModule } from './modules/common/user/user.module'
import { TenantBootstrapModule } from './modules/common/tenants/bootstrap/bootstrap.module'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './modules/auth/auth.module'
import { CatalogModule } from './modules/tenant/catalog/catalog.module'

@Module({
  imports: [
    //_CONFIG
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TenancyModule,
    //
    MongooseModule.forRoot(
      process.env.MONGO_COMMON_URI!,
    ),
    AuthModule,
    //_COMMON
    TenantsModule,
    CommonUserModule,
    TenantBootstrapModule,
    //_TENANT
    TenantUserModule,
    CatalogModule,
  ],
})
export class AppModule { }
