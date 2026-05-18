import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import {
    TENANT_MODEL_REGISTRY,
} from '@phen0menon/nestjs-mongoose-tenancy'

import type {
    TenantModelRegistry,
} from '@phen0menon/nestjs-mongoose-tenancy'

import { TenantRepository } from 'src/public/db/tenant.repository'

import {
    ROOM_MODEL_NAME,
    RoomDocument,
} from './room.schema'

import { CreateRoomDto } from './dto/create-room.dto'
import { UpdateRoomDto } from './dto/update-room.dto'

@Injectable()
export class RoomService extends TenantRepository<RoomDocument> {
    constructor(
        @Inject(TENANT_MODEL_REGISTRY)
        modelRegistry: TenantModelRegistry,
    ) {
        super(modelRegistry, ROOM_MODEL_NAME)
    }

    async createRoom(tenantId: string, data: CreateRoomDto) {
        return this.createDocument(data, tenantId)
    }

    async findAllRooms(tenantId: string) {
        return this.modelFor(tenantId).find().lean()
    }

    async findRoomById(tenantId: string, id: string) {
        const room = await this.modelFor(tenantId).findById(id)

        if (!room) {
            throw new NotFoundException('Room not found')
        }

        return room
    }

    async updateRoom(
        tenantId: string,
        id: string,
        data: UpdateRoomDto,
    ) {
        return this.modelFor(tenantId).findByIdAndUpdate(
            id,
            data,
            { new: true },
        )
    }

    async deleteRoom(tenantId: string, id: string) {
        return this.modelFor(tenantId).findByIdAndDelete(id)
    }
}