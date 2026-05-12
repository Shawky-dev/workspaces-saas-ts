import { Module } from '@nestjs/common'
import { TenantBootstrapService } from './bootstrap.service'
import { TenantUserBootstrapper } from 'src/modules/tenant/user/user.bootstrapper'
import { TENANT_BOOTSTRAPPERS } from './bootstrap.interface'
import { TenantUserModule } from 'src/modules/tenant/user/user.module'

@Module({
    providers: [
        TenantBootstrapService,
        TenantUserBootstrapper,
        {
            provide: TENANT_BOOTSTRAPPERS,
            useFactory: (userBootstrapper: TenantUserBootstrapper) => [userBootstrapper],
            inject: [TenantUserBootstrapper],
        },
    ],
    imports: [TenantUserModule],
    exports: [TenantBootstrapService],
})
export class TenantBootstrapModule { }
