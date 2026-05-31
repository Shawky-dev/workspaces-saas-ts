import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common'

import { TenantAuthGuard } from 'src/modules/auth/guards/tenant-auth.guard'
import { RolesGuard } from 'src/modules/auth/guards/roles.guard'
import { Roles } from 'src/modules/auth/decorators/roles.decorator'
import { TenantUserRole } from '../user/role.enum'
import { RoomService } from './room.service'

import { CreateRoomDto } from './dto/create-room.dto'
import { UpdateRoomDto } from './dto/update-room.dto'

@UseGuards(TenantAuthGuard, RolesGuard)
@Roles(TenantUserRole.SUPER_ADMIN, TenantUserRole.RECEPTIONIST)
@Controller(':tenantId/rooms')
export class RoomController {
    constructor(private readonly roomService: RoomService) {}

    @Post()
    async create(
        @Param('tenantId') tenantId: string,
        @Body() dto: CreateRoomDto,
    ) {
        return this.roomService.createRoom(tenantId, dto)
    }

    @Get()
    async findAll(
        @Param('tenantId') tenantId: string,
    ) {
        return this.roomService.findAllRooms(tenantId)
    }

    @Get(':id')
    async findOne(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.roomService.findRoomById(tenantId, id)
    }

    @Patch(':id')
    async update(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateRoomDto,
    ) {
        return this.roomService.updateRoom(
            tenantId,
            id,
            dto,
        )
    }

    @Delete(':id')
    async remove(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.roomService.deleteRoom(
            tenantId,
            id,
        )
    }
}