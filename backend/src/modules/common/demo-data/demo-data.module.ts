import { Module } from '@nestjs/common'
import { CatalogModule } from 'src/modules/tenant/catalog/catalog.module'
import { CustomerModule } from 'src/modules/tenant/customer/customer.module'
import { ReservationModule } from 'src/modules/tenant/reservation/reservation.module'
import { RoomModule } from 'src/modules/tenant/room/room.module'
import { SessionModule } from 'src/modules/tenant/session/session.module'
import { TenantBootstrapModule } from '../tenants/bootstrap/bootstrap.module'
import { TenantsModule } from '../tenants/tenant.module'
import { DemoDataController } from './demo-data.controller'
import { DemoDataService } from './demo-data.service'

@Module({
    imports: [
        TenantsModule,
        TenantBootstrapModule,
        CatalogModule,
        CustomerModule,
        RoomModule,
        SessionModule,
        ReservationModule,
    ],
    controllers: [DemoDataController],
    providers: [DemoDataService],
})
export class DemoDataModule { }
