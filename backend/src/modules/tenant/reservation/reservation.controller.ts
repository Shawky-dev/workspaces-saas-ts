import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common'
import { TenantAuthGuard } from 'src/modules/auth/guards/tenant-auth.guard'
import { CancelReservationDto } from './dto/cancel-reservation.dto'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { UpdateReservationDto } from './dto/update-reservation.dto'
import { UpdateReservationSettingsDto } from './dto/update-reservation-settings.dto'
import { ReservationService } from './reservation.service'

@UseGuards(TenantAuthGuard)
@Controller(':tenantId')
export class ReservationController {
    constructor(private readonly reservations: ReservationService) { }

    @Get('reservation-settings')
    async getSettings(@Param('tenantId') tenantId: string) {
        return this.reservations.getSettings(tenantId)
    }

    @Put('reservation-settings')
    async updateSettings(
        @Param('tenantId') tenantId: string,
        @Body() dto: UpdateReservationSettingsDto,
    ) {
        return this.reservations.updateSettings(tenantId, dto)
    }

    @Get('reservations')
    async findAll(
        @Param('tenantId') tenantId: string,
        @Query('weekStart') weekStart?: string,
    ) {
        return this.reservations.listReservations(tenantId, weekStart)
    }

    @Get('reservations/timetable')
    async timetable(
        @Param('tenantId') tenantId: string,
        @Query('weekStart') weekStart?: string,
    ) {
        return this.reservations.getTimetable(tenantId, weekStart)
    }

    @Post('reservations')
    async create(
        @Param('tenantId') tenantId: string,
        @Body() dto: CreateReservationDto,
    ) {
        return this.reservations.createReservation(tenantId, dto)
    }

    @Get('reservations/:id')
    async findOne(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.reservations.getReservationById(tenantId, id)
    }

    @Patch('reservations/:id')
    async update(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateReservationDto,
    ) {
        return this.reservations.updateReservation(tenantId, id, dto)
    }

    @Post('reservations/:id/cancel')
    async cancel(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: CancelReservationDto,
    ) {
        return this.reservations.cancelReservation(tenantId, id, dto)
    }

    @Post('reservations/:id/confirm-arrival')
    async confirmArrival(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.reservations.confirmArrival(tenantId, id)
    }
}
