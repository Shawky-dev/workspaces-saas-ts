import { Module } from '@nestjs/common'
import { MongooseTenancyModule } from '@phen0menon/nestjs-mongoose-tenancy'
import {
    SESSION_MODEL_NAME,
    SessionSchema,
} from './session.schema'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'

@Module({
    imports: [
        MongooseTenancyModule.forFeature([
            {
                name: SESSION_MODEL_NAME,
                schema: SessionSchema,
            },
        ]),
    ],
    controllers: [SessionController],
    providers: [SessionService],
    exports: [SessionService],
})
export class SessionModule { }
