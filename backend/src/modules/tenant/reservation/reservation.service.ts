import {
    BadRequestException,
    Injectable,
    Inject,
    NotFoundException,
} from '@nestjs/common'
import { TENANT_MODEL_REGISTRY } from '@phen0menon/nestjs-mongoose-tenancy'
import type { TenantModelRegistry } from '@phen0menon/nestjs-mongoose-tenancy'
import { Model } from 'mongoose'
import { TenantRepository } from 'src/public/db/tenant.repository'
import {
    CUSTOMER_MODEL_NAME,
    CustomerDocument,
} from '../customer/customer.schema'
import {
    ROOM_MODEL_NAME,
    RoomDocument,
    RoomType,
} from '../room/room.schema'
import { CreateCustomerDto } from '../customer/dto/create-customer.dto'
import { SessionService } from '../session/session.service'
import { CancelReservationDto } from './dto/cancel-reservation.dto'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { UpdateReservationDto } from './dto/update-reservation.dto'
import { UpdateReservationSettingsDto } from './dto/update-reservation-settings.dto'
import {
    RESERVATION_MODEL_NAME,
    ReservationDocument,
    ReservationStatus,
} from './reservation.schema'
import {
    RESERVATION_SETTINGS_MODEL_NAME,
    ReservationSettingsDocument,
} from './reservation-settings.schema'

const DEFAULT_TIMEZONE = 'Africa/Cairo'
const DEFAULT_SLOT_MINUTES = 30
const DAY_MS = 24 * 60 * 60 * 1000

@Injectable()
export class ReservationService extends TenantRepository<ReservationDocument> {
    constructor(
        @Inject(TENANT_MODEL_REGISTRY)
        private readonly registry: TenantModelRegistry,
        private readonly sessionService: SessionService,
    ) {
        super(registry, RESERVATION_MODEL_NAME)
    }

    async getSettings(tenantId: string) {
        const existing = await this.settingsModel(tenantId).findOne().lean()

        if (existing) {
            return this.toPublicSettings(existing)
        }

        const settings = await this.settingsModel(tenantId).create(this.defaultSettings())
        return this.toPublicSettings(settings)
    }

    async updateSettings(tenantId: string, dto: UpdateReservationSettingsDto) {
        this.validateSettings(dto)

        const settings = await this.settingsModel(tenantId)
            .findOneAndUpdate(
                {},
                {
                    timezone: dto.timezone ?? DEFAULT_TIMEZONE,
                    slotMinutes: dto.slotMinutes,
                    weeklyHours: dto.weeklyHours,
                },
                { new: true, upsert: true },
            )
            .lean()

        return this.toPublicSettings(settings)
    }

    async listReservations(tenantId: string, weekStart?: string) {
        const settings = await this.getSettings(tenantId)
        const filter: any = {}

        if (weekStart) {
            const { start, end } = this.weekRange(weekStart, settings.timezone)
            filter.startsAt = { $lt: end }
            filter.endsAt = { $gt: start }
        }

        const reservations = await this.modelFor(tenantId)
            .find(filter)
            .sort({ startsAt: 1 })
            .lean()

        return reservations.map((reservation) => this.toPublicReservation(reservation))
    }

    async getTimetable(tenantId: string, weekStart?: string) {
        const settings = await this.getSettings(tenantId)
        const { start, end, startKey } = this.weekRange(weekStart, settings.timezone)
        const reservations = await this.modelFor(tenantId)
            .find({
                startsAt: { $lt: end },
                endsAt: { $gt: start },
            })
            .sort({ startsAt: 1 })
            .lean()
        const slots = this.generateWeekSlots(start, settings)

        return {
            weekStart: startKey,
            weekEnd: this.addDaysToDateKey(startKey, 7),
            settings,
            slots: slots.map((slot) => ({
                ...slot,
                reservations: reservations
                    .filter((reservation: any) => this.overlaps(slot.startsAt, slot.endsAt, reservation.startsAt, reservation.endsAt))
                    .map((reservation) => this.toPublicReservation(reservation)),
            })),
        }
    }

    async createReservation(tenantId: string, dto: CreateReservationDto) {
        const { startsAt, endsAt } = await this.validateReservationRange(tenantId, dto.startsAt, dto.endsAt)
        const customer = await this.resolveCustomer(tenantId, dto)
        const roomBookings = await this.resolveRoomBookings(tenantId, dto.roomBookings)

        await this.ensureNoReservationConflicts(tenantId, roomBookings, startsAt, endsAt)

        const reservation = await this.createDocument({
            status: ReservationStatus.SCHEDULED,
            customer,
            roomBookings,
            startsAt,
            endsAt,
        } as Partial<ReservationDocument>, tenantId)

        return this.toPublicReservation(reservation)
    }

    async getReservationById(tenantId: string, id: string) {
        const reservation = await this.modelFor(tenantId).findById(id).lean()

        if (!reservation) {
            throw new NotFoundException('Reservation not found')
        }

        return this.toPublicReservation(reservation)
    }

    async updateReservation(tenantId: string, id: string, dto: UpdateReservationDto) {
        const reservation = await this.findScheduledReservation(tenantId, id)
        const startsAtInput = dto.startsAt ?? reservation.startsAt.toISOString()
        const endsAtInput = dto.endsAt ?? reservation.endsAt.toISOString()
        const { startsAt, endsAt } = await this.validateReservationRange(tenantId, startsAtInput, endsAtInput)
        const customer = dto.customerId || dto.customer
            ? await this.resolveCustomer(tenantId, dto as CreateReservationDto)
            : reservation.customer
        const roomBookings = dto.roomBookings
            ? await this.resolveRoomBookings(tenantId, dto.roomBookings)
            : reservation.roomBookings

        await this.ensureNoReservationConflicts(tenantId, roomBookings, startsAt, endsAt, id)

        reservation.set({
            customer,
            roomBookings,
            startsAt,
            endsAt,
        })

        const saved = await reservation.save()
        return this.toPublicReservation(saved)
    }

    async cancelReservation(tenantId: string, id: string, dto: CancelReservationDto) {
        const reservation = await this.findScheduledReservation(tenantId, id)

        reservation.status = ReservationStatus.CANCELED
        reservation.canceledAt = new Date()
        reservation.cancelReason = dto.reason

        const saved = await reservation.save()
        return this.toPublicReservation(saved)
    }

    async confirmArrival(tenantId: string, id: string) {
        const reservation = await this.findScheduledReservation(tenantId, id)
        const session = await this.sessionService.createSessionFromSnapshot(
            tenantId,
            reservation.customer,
            reservation.roomBookings,
        )

        reservation.status = ReservationStatus.ARRIVED
        reservation.arrivedAt = new Date()
        reservation.sessionId = (session as any)._id?.toString?.() ?? (session as any).id

        const saved = await reservation.save()

        return {
            reservation: this.toPublicReservation(saved),
            session: this.sessionService.serializeSession(session),
        }
    }

    private async findScheduledReservation(tenantId: string, id: string) {
        const reservation = await this.modelFor(tenantId).findById(id)

        if (!reservation) {
            throw new NotFoundException('Reservation not found')
        }

        if (reservation.status !== ReservationStatus.SCHEDULED) {
            throw new BadRequestException('Only scheduled reservations can be changed')
        }

        return reservation
    }

    private async validateReservationRange(tenantId: string, startsAtInput: string, endsAtInput: string) {
        const settings = await this.getSettings(tenantId)
        const startsAt = new Date(startsAtInput)
        const endsAt = new Date(endsAtInput)

        if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
            throw new BadRequestException('Reservation end time must be after start time')
        }

        const durationMinutes = (endsAt.getTime() - startsAt.getTime()) / 60000

        if (durationMinutes % settings.slotMinutes !== 0) {
            throw new BadRequestException('Reservation duration must align with slot length')
        }

        const startDateKey = this.dateKeyInTimeZone(startsAt, settings.timezone)
        const endDateKey = this.dateKeyInTimeZone(endsAt, settings.timezone)
        const daySettings = settings.weeklyHours.find((day) => day.dayOfWeek === this.dayOfWeekInTimeZone(startsAt, settings.timezone))

        if (!daySettings?.enabled) {
            throw new BadRequestException('Reservations are not allowed on this day')
        }

        const startMinutes = this.minutesInTimeZone(startsAt, settings.timezone)
        const endMinutes = this.minutesInTimeZone(endsAt, settings.timezone)

        if (
            startMinutes < this.timeToMinutes(daySettings.opensAt)
            || endMinutes > this.timeToMinutes(daySettings.closesAt)
            || startDateKey !== endDateKey
        ) {
            throw new BadRequestException('Reservation is outside allowed hours')
        }

        return { startsAt, endsAt }
    }

    private async ensureNoReservationConflicts(
        tenantId: string,
        roomBookings: any[],
        startsAt: Date,
        endsAt: Date,
        excludedReservationId?: string,
    ) {
        const overlappingReservations = await this.modelFor(tenantId)
            .find({
                status: ReservationStatus.SCHEDULED,
                ...(excludedReservationId ? { _id: { $ne: excludedReservationId } } : {}),
                startsAt: { $lt: endsAt },
                endsAt: { $gt: startsAt },
            })
            .lean()
        const rooms = await this.roomModel(tenantId).find().lean()
        const roomsById = new Map(rooms.map((room: any) => [room._id.toString(), room]))

        for (const booking of roomBookings) {
            if (booking.type === RoomType.PRIVATE) {
                const conflict = overlappingReservations.some((reservation: any) => {
                    return reservation.roomBookings?.some((existing: any) => existing.roomId === booking.roomId)
                })

                if (conflict) {
                    throw new BadRequestException(`${booking.roomName} is already reserved at this time`)
                }

                continue
            }

            const room: any = roomsById.get(booking.roomId)
            const alreadyReservedSeats = overlappingReservations.reduce((total: number, reservation: any) => {
                return total + (reservation.roomBookings ?? [])
                    .filter((existing: any) => existing.roomId === booking.roomId)
                    .reduce((seatTotal: number, existing: any) => seatTotal + existing.seatCount, 0)
            }, 0)

            if (alreadyReservedSeats + booking.seatCount > (room?.seats ?? 0)) {
                throw new BadRequestException(`${booking.roomName} does not have enough seats at this time`)
            }
        }
    }

    private async resolveCustomer(tenantId: string, dto: { customerId?: string, customer?: any }) {
        let customer: any

        if (dto.customerId) {
            customer = await this.customerModel(tenantId).findById(dto.customerId).lean()
        } else if (dto.customer) {
            customer = await this.customerModel(tenantId).create(dto.customer as CreateCustomerDto)
        }

        if (!customer) {
            throw new BadRequestException('A customerId or customer payload is required')
        }

        return {
            customerId: customer._id.toString(),
            firstName: customer.firstName,
            lastName: customer.lastName,
            phoneNumber: customer.phoneNumber,
            email: customer.email,
        }
    }

    private async resolveRoomBookings(tenantId: string, requestedBookings: any[]) {
        const rooms = await this.roomModel(tenantId)
            .find({ _id: { $in: requestedBookings.map((booking) => booking.roomId) } })
            .lean()

        if (rooms.length !== requestedBookings.length) {
            throw new NotFoundException('One or more rooms were not found')
        }

        const roomsById = new Map(rooms.map((room: any) => [room._id.toString(), room]))
        const seen = new Set<string>()

        return requestedBookings.map((requested) => {
            if (seen.has(requested.roomId)) {
                throw new BadRequestException(`Room "${requested.roomId}" was selected more than once`)
            }

            seen.add(requested.roomId)
            const room: any = roomsById.get(requested.roomId)
            const seatCount = requested.seatCount ?? 1

            if (room.type === RoomType.PRIVATE && seatCount !== 1) {
                throw new BadRequestException('Private room bookings must use one seat')
            }

            if (room.type === RoomType.PUBLIC && seatCount > (room.seats ?? 0)) {
                throw new BadRequestException(`${room.name} does not have enough seats`)
            }

            return {
                roomId: room._id.toString(),
                roomName: room.name,
                type: room.type,
                ratePerHour: room.ratePerHour,
                seatCount,
            }
        })
    }

    private validateSettings(dto: UpdateReservationSettingsDto) {
        if (![15, 30, 45, 60, 90, 120, 180, 240].includes(dto.slotMinutes)) {
            throw new BadRequestException('Unsupported slot length')
        }

        const days = new Set<number>()

        for (const day of dto.weeklyHours) {
            if (days.has(day.dayOfWeek)) {
                throw new BadRequestException('Each day can only be configured once')
            }

            days.add(day.dayOfWeek)

            if (day.enabled && this.timeToMinutes(day.closesAt) <= this.timeToMinutes(day.opensAt)) {
                throw new BadRequestException('Closing time must be after opening time')
            }
        }
    }

    private generateWeekSlots(weekStart: Date, settings: any) {
        const slots: any[] = []
        const weekStartKey = this.dateKeyInTimeZone(weekStart, settings.timezone)

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const dateKey = this.addDaysToDateKey(weekStartKey, dayOffset)
            const dayOfWeek = this.dayOfWeekFromDateKey(dateKey)
            const daySettings = settings.weeklyHours.find((day) => day.dayOfWeek === dayOfWeek)

            if (!daySettings?.enabled) {
                continue
            }

            const opensAt = this.timeToMinutes(daySettings.opensAt)
            const closesAt = this.timeToMinutes(daySettings.closesAt)

            for (let minutes = opensAt; minutes < closesAt; minutes += settings.slotMinutes) {
                const startsAt = this.dateInTimeZone(dateKey, minutes, settings.timezone)
                const endsAt = new Date(startsAt.getTime() + settings.slotMinutes * 60000)

                slots.push({
                    date: dateKey,
                    startsAt,
                    endsAt,
                    label: `${this.minutesToTime(minutes)} - ${this.minutesToTime(minutes + settings.slotMinutes)}`,
                })
            }
        }

        return slots
    }

    private weekRange(weekStart: string | undefined, timezone: string) {
        let startKey = weekStart

        if (!startKey) {
            const todayKey = this.dateKeyInTimeZone(new Date(), timezone)
            startKey = this.addDaysToDateKey(
                todayKey,
                -this.dayOfWeekFromDateKey(todayKey),
            )
        }

        const start = this.dateInTimeZone(startKey, 0, timezone)
        const end = this.dateInTimeZone(this.addDaysToDateKey(startKey, 7), 0, timezone)
        return { start, end, startKey }
    }

    private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
        return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart)
    }

    private timeToMinutes(time: string) {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
    }

    private minutesToTime(totalMinutes: number) {
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    private dateInTimeZone(dateKey: string, minutes: number, timezone: string) {
        const [year, month, day] = dateKey.split('-').map(Number)
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        const localAsUtc = Date.UTC(year, month - 1, day, hours, mins, 0, 0)
        const firstGuess = new Date(localAsUtc)
        const firstOffset = this.timeZoneOffsetMinutes(firstGuess, timezone)
        const secondGuess = new Date(localAsUtc - firstOffset * 60000)
        const secondOffset = this.timeZoneOffsetMinutes(secondGuess, timezone)
        return new Date(localAsUtc - secondOffset * 60000)
    }

    private timeZoneOffsetMinutes(date: Date, timezone: string) {
        const parts = this.timeZoneParts(date, timezone)
        const asUtc = Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second,
        )
        return (asUtc - date.getTime()) / 60000
    }

    private timeZoneParts(date: Date, timezone: string) {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(date)
        const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)

        return {
            year: value('year'),
            month: value('month'),
            day: value('day'),
            hour: value('hour'),
            minute: value('minute'),
            second: value('second'),
        }
    }

    private dateKeyInTimeZone(date: Date, timezone: string) {
        const parts = this.timeZoneParts(date, timezone)
        return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
    }

    private minutesInTimeZone(date: Date, timezone: string) {
        const parts = this.timeZoneParts(date, timezone)
        return parts.hour * 60 + parts.minute
    }

    private dayOfWeekInTimeZone(date: Date, timezone: string) {
        return this.dayOfWeekFromDateKey(this.dateKeyInTimeZone(date, timezone))
    }

    private dayOfWeekFromDateKey(dateKey: string) {
        return new Date(`${dateKey}T00:00:00Z`).getUTCDay()
    }

    private addDaysToDateKey(dateKey: string, days: number) {
        const [year, month, day] = dateKey.split('-').map(Number)
        const date = new Date(Date.UTC(year, month - 1, day))
        date.setUTCDate(date.getUTCDate() + days)
        return date.toISOString().slice(0, 10)
    }

    private defaultSettings() {
        return {
            timezone: DEFAULT_TIMEZONE,
            slotMinutes: DEFAULT_SLOT_MINUTES,
            weeklyHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({
                dayOfWeek,
                enabled: dayOfWeek >= 1 && dayOfWeek <= 5,
                opensAt: '09:00',
                closesAt: '17:00',
            })),
        }
    }

    private customerModel(tenantId: string): Model<CustomerDocument> {
        return this.modelByName<CustomerDocument>(tenantId, CUSTOMER_MODEL_NAME)
    }

    private roomModel(tenantId: string): Model<RoomDocument> {
        return this.modelByName<RoomDocument>(tenantId, ROOM_MODEL_NAME)
    }

    private settingsModel(tenantId: string): Model<ReservationSettingsDocument> {
        return this.modelByName<ReservationSettingsDocument>(tenantId, RESERVATION_SETTINGS_MODEL_NAME)
    }

    private modelByName<T>(tenantId: string, modelName: string): Model<T> {
        const model = this.registry.getModelMap<T>(modelName).get(tenantId)

        if (!model) {
            throw new Error(`No model for tenant "${tenantId}"`)
        }

        return model
    }

    private toPublicSettings(settings: any) {
        return {
            id: settings._id?.toString?.() ?? settings.id,
            timezone: settings.timezone,
            slotMinutes: settings.slotMinutes,
            weeklyHours: (settings.weeklyHours ?? []).map((day: any) => ({
                dayOfWeek: day.dayOfWeek,
                enabled: day.enabled,
                opensAt: day.opensAt,
                closesAt: day.closesAt,
            })),
            createdAt: settings.createdAt,
            updatedAt: settings.updatedAt,
        }
    }

    private toPublicReservation(reservation: any) {
        return {
            id: reservation._id?.toString?.() ?? reservation.id,
            status: reservation.status,
            customer: reservation.customer,
            roomBookings: reservation.roomBookings ?? [],
            startsAt: reservation.startsAt,
            endsAt: reservation.endsAt,
            arrivedAt: reservation.arrivedAt,
            sessionId: reservation.sessionId,
            canceledAt: reservation.canceledAt,
            cancelReason: reservation.cancelReason,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
        }
    }
}
