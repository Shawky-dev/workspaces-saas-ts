import { Module } from '@nestjs/common'
import { MongooseTenancyModule } from '@phen0menon/nestjs-mongoose-tenancy'

import { RoomController } from './room.controller'
import { RoomService } from './room.service'

import { ROOM_MODEL_NAME, RoomSchema } from './room.schema'

@Module({
    imports: [
        MongooseTenancyModule.forFeature([
            {
                name: ROOM_MODEL_NAME,
                schema: RoomSchema,
            },
        ]),
    ],
    controllers: [RoomController],
    providers: [RoomService],
    exports: [RoomService],
})
export class RoomModule {}