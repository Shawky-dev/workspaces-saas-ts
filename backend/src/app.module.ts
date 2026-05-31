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
import { RoomModule } from './modules/tenant/room/room.module'
import { CustomerModule } from './modules/tenant/customer/customer.module'
import { SessionModule } from './modules/tenant/session/session.module'

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
    RoomModule,
    CustomerModule,
    SessionModule,
  ],
})
export class AppModule { }
