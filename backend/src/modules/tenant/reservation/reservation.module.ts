import { Module } from '@nestjs/common'
import { MongooseTenancyModule } from '@phen0menon/nestjs-mongoose-tenancy'
import { SessionModule } from '../session/session.module'
import {
    RESERVATION_MODEL_NAME,
    ReservationSchema,
} from './reservation.schema'
import {
    RESERVATION_SETTINGS_MODEL_NAME,
    ReservationSettingsSchema,
} from './reservation-settings.schema'
import { ReservationController } from './reservation.controller'
import { ReservationService } from './reservation.service'

@Module({
    imports: [
        MongooseTenancyModule.forFeature([
            {
                name: RESERVATION_MODEL_NAME,
                schema: ReservationSchema,
            },
            {
                name: RESERVATION_SETTINGS_MODEL_NAME,
                schema: ReservationSettingsSchema,
            },
        ]),
        SessionModule,
    ],
    controllers: [ReservationController],
    providers: [ReservationService],
    exports: [ReservationService],
})
export class ReservationModule { }
