import {
    BadRequestException,
    Injectable,
    Inject,
    NotFoundException,
} from '@nestjs/common'
import {
    TENANT_MODEL_REGISTRY,
} from '@phen0menon/nestjs-mongoose-tenancy'
import type {
    TenantModelRegistry,
} from '@phen0menon/nestjs-mongoose-tenancy'
import { Model } from 'mongoose'
import { TenantRepository } from 'src/public/db/tenant.repository'
import {
    CUSTOMER_MODEL_NAME,
    CustomerDocument,
} from '../customer/customer.schema'
import {
    CATALOG_ITEM_MODEL_NAME,
    CatalogItemDocument,
} from '../catalog/catalog-item.schema'
import {
    ROOM_MODEL_NAME,
    RoomDocument,
    RoomType,
} from '../room/room.schema'
import { CreateCustomerDto } from '../customer/dto/create-customer.dto'
import { CloseSessionDto } from './dto/close-session.dto'
import { StartSessionDto } from './dto/start-session.dto'
import { UpdateSessionProductsDto } from './dto/update-session-products.dto'
import {
    SESSION_MODEL_NAME,
    SessionDocument,
    SessionStatus,
} from './session.schema'

const MIN_BILLABLE_MINUTES = 15
const BILLING_BLOCK_MINUTES = 15

@Injectable()
export class SessionService extends TenantRepository<SessionDocument> {
    constructor(
        @Inject(TENANT_MODEL_REGISTRY)
        private readonly registry: TenantModelRegistry,
    ) {
        super(registry, SESSION_MODEL_NAME)
    }

    async getAvailability(tenantId: string) {
        const rooms = await this.roomModel(tenantId).find().lean()
        const activeSessions = await this.activeSessionQuery(tenantId)

        const bookedPrivateRoomIds = new Set<string>()
        const bookedPublicSeats = new Map<string, number>()

        for (const session of activeSessions) {
            for (const booking of session.roomBookings ?? []) {
                if (booking.type === RoomType.PRIVATE) {
                    bookedPrivateRoomIds.add(booking.roomId)
                    continue
                }

                bookedPublicSeats.set(
                    booking.roomId,
                    (bookedPublicSeats.get(booking.roomId) ?? 0) + booking.seatCount,
                )
            }
        }

        return rooms.map((room: any) => {
            const id = room._id.toString()
            const totalSeats = room.type === RoomType.PUBLIC
                ? room.seats ?? 0
                : 1
            const occupiedSeats = room.type === RoomType.PUBLIC
                ? bookedPublicSeats.get(id) ?? 0
                : bookedPrivateRoomIds.has(id) ? 1 : 0
            const availableSeats = Math.max(0, totalSeats - occupiedSeats)

            return {
                id,
                name: room.name,
                type: room.type,
                ratePerHour: room.ratePerHour,
                totalSeats,
                occupiedSeats,
                availableSeats,
                isAvailable: availableSeats > 0,
            }
        })
    }

    async startSession(tenantId: string, dto: StartSessionDto) {
        const customer = await this.resolveCustomer(tenantId, dto)
        const roomBookings = await this.resolveRoomBookings(tenantId, dto.roomBookings)

        const session = await this.createDocument({
            status: SessionStatus.ACTIVE,
            customer,
            roomBookings,
            productLines: [],
            startedAt: new Date(),
        } as Partial<SessionDocument>, tenantId)

        return this.toPublicSession(session)
    }

    async getActiveSessions(tenantId: string) {
        const sessions = await this.activeSessionQuery(tenantId)
        return sessions.map((session) => this.toPublicSession(session))
    }

    async getSessionById(tenantId: string, id: string) {
        const session = await this.modelFor(tenantId).findById(id).lean()

        if (!session) {
            throw new NotFoundException('Session not found')
        }

        return this.toPublicSession(session)
    }

    async updateProducts(
        tenantId: string,
        id: string,
        dto: UpdateSessionProductsDto,
    ) {
        const session = await this.findMutableSession(tenantId, id)
        session.productLines = await this.resolveProductLines(tenantId, dto.products)
        const saved = await session.save()

        return this.toPublicSession(saved)
    }

    async closeSession(
        tenantId: string,
        id: string,
        dto: CloseSessionDto,
    ) {
        const session = await this.findMutableSession(tenantId, id)

        await this.validateAndDeductInventory(tenantId, session.productLines ?? [])

        const closedAt = new Date()
        const billableMinutes = this.calculateBillableMinutes(
            session.startedAt,
            closedAt,
        )
        const billableHours = billableMinutes / 60
        const roomSubtotal = this.roundMoney(
            (session.roomBookings ?? []).reduce((total, booking) => {
                return total + booking.ratePerHour * booking.seatCount * billableHours
            }, 0),
        )
        const productsSubtotal = this.roundMoney(
            (session.productLines ?? []).reduce((total, line) => {
                return total + line.unitPrice * line.quantity
            }, 0),
        )
        const discount = this.roundMoney(dto.discount ?? 0)
        const total = this.roundMoney(Math.max(0, roomSubtotal + productsSubtotal - discount))

        session.status = SessionStatus.CLOSED
        session.closedAt = closedAt
        session.receipt = {
            billableMinutes,
            roomSubtotal,
            productsSubtotal,
            discount,
            total,
            paymentStatus: dto.paymentStatus,
            paymentMethod: dto.paymentMethod,
            roomBookings: session.roomBookings,
            productLines: session.productLines,
        } as any

        const saved = await session.save()
        return this.toPublicSession(saved)
    }

    async getReceipts(tenantId: string) {
        const sessions = await this.modelFor(tenantId)
            .find({ status: SessionStatus.CLOSED })
            .sort({ closedAt: -1 })
            .lean()

        return sessions.map((session) => this.toPublicReceipt(session))
    }

    async getReceiptById(tenantId: string, id: string) {
        const session = await this.modelFor(tenantId)
            .findOne({ _id: id, status: SessionStatus.CLOSED })
            .lean()

        if (!session) {
            throw new NotFoundException('Receipt not found')
        }

        return this.toPublicReceipt(session)
    }

    async getCustomerReceipts(tenantId: string, customerId: string) {
        const sessions = await this.modelFor(tenantId)
            .find({
                status: SessionStatus.CLOSED,
                'customer.customerId': customerId,
            })
            .sort({ closedAt: -1 })
            .lean()

        return sessions.map((session) => this.toPublicReceipt(session))
    }

    private async activeSessionQuery(tenantId: string) {
        return this.modelFor(tenantId)
            .find({ status: SessionStatus.ACTIVE })
            .sort({ startedAt: 1 })
            .lean()
    }

    private async findMutableSession(tenantId: string, id: string) {
        const session = await this.modelFor(tenantId).findById(id)

        if (!session) {
            throw new NotFoundException('Session not found')
        }

        if (session.status !== SessionStatus.ACTIVE) {
            throw new BadRequestException('Closed sessions cannot be modified')
        }

        return session
    }

    private async resolveCustomer(tenantId: string, dto: StartSessionDto) {
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

    private async resolveRoomBookings(
        tenantId: string,
        requestedBookings: StartSessionDto['roomBookings'],
    ) {
        const duplicateRoomId = this.findDuplicate(
            requestedBookings.map((booking) => booking.roomId),
        )

        if (duplicateRoomId) {
            throw new BadRequestException(`Room "${duplicateRoomId}" was selected more than once`)
        }

        const availability = await this.getAvailability(tenantId)
        const availabilityById = new Map(availability.map((room) => [room.id, room]))
        const bookings: any[] = []

        for (const requested of requestedBookings) {
            const room = availabilityById.get(requested.roomId)

            if (!room) {
                throw new NotFoundException('Room not found')
            }

            const seatCount = requested.seatCount ?? 1

            if (room.type === RoomType.PRIVATE && seatCount !== 1) {
                throw new BadRequestException('Private room bookings must use one seat')
            }

            if (seatCount > room.availableSeats) {
                throw new BadRequestException(`${room.name} does not have enough availability`)
            }

            bookings.push({
                roomId: room.id,
                roomName: room.name,
                type: room.type,
                ratePerHour: room.ratePerHour,
                seatCount,
            })
        }

        return bookings
    }

    private async resolveProductLines(
        tenantId: string,
        requestedProducts: UpdateSessionProductsDto['products'],
    ) {
        const duplicateProductId = this.findDuplicate(
            requestedProducts.map((product) => product.catalogItemId),
        )

        if (duplicateProductId) {
            throw new BadRequestException(`Product "${duplicateProductId}" was selected more than once`)
        }

        if (requestedProducts.length === 0) {
            return []
        }

        const ids = requestedProducts.map((product) => product.catalogItemId)
        const products = await this.catalogModel(tenantId)
            .find({ _id: { $in: ids } })
            .select('-imageData')
            .lean()

        if (products.length !== ids.length) {
            throw new NotFoundException('One or more products were not found')
        }

        const productsById = new Map(
            products.map((product: any) => [product._id.toString(), product]),
        )

        return requestedProducts.map((requested) => {
            const product: any = productsById.get(requested.catalogItemId)

            if ((product.quantityOnHand ?? 0) < requested.quantity) {
                throw new BadRequestException(`${product.name} only has ${product.quantityOnHand ?? 0} in stock`)
            }

            return {
                catalogItemId: requested.catalogItemId,
                name: product.name,
                unitPrice: product.soldPrice,
                quantity: requested.quantity,
            }
        })
    }

    private async validateAndDeductInventory(
        tenantId: string,
        productLines: any[],
    ) {
        if (productLines.length === 0) {
            return
        }

        const model = this.catalogModel(tenantId)
        const ids = productLines.map((line) => line.catalogItemId)
        const products = await model
            .find({ _id: { $in: ids } })
            .select('_id name quantityOnHand')
            .lean()

        if (products.length !== ids.length) {
            throw new NotFoundException('One or more products were not found')
        }

        const productsById = new Map(
            products.map((product: any) => [product._id.toString(), product]),
        )

        for (const line of productLines) {
            const product: any = productsById.get(line.catalogItemId)

            if ((product.quantityOnHand ?? 0) < line.quantity) {
                throw new BadRequestException(`${product.name} does not have enough stock`)
            }
        }

        await model.bulkWrite(
            productLines.map((line) => ({
                updateOne: {
                    filter: { _id: line.catalogItemId },
                    update: { $inc: { quantityOnHand: -line.quantity } },
                },
            })),
        )
    }

    private calculateBillableMinutes(startedAt: Date, closedAt: Date) {
        const durationMinutes = Math.max(
            0,
            Math.floor((closedAt.getTime() - new Date(startedAt).getTime()) / 60000),
        )
        const billableMinutes =
            Math.floor(durationMinutes / BILLING_BLOCK_MINUTES) * BILLING_BLOCK_MINUTES

        return Math.max(MIN_BILLABLE_MINUTES, billableMinutes)
    }

    private roundMoney(value: number) {
        return Math.round(value * 100) / 100
    }

    private findDuplicate(values: string[]) {
        const seen = new Set<string>()

        for (const value of values) {
            if (seen.has(value)) {
                return value
            }

            seen.add(value)
        }

        return null
    }

    private customerModel(tenantId: string): Model<CustomerDocument> {
        return this.modelByName<CustomerDocument>(tenantId, CUSTOMER_MODEL_NAME)
    }

    private roomModel(tenantId: string): Model<RoomDocument> {
        return this.modelByName<RoomDocument>(tenantId, ROOM_MODEL_NAME)
    }

    private catalogModel(tenantId: string): Model<CatalogItemDocument> {
        return this.modelByName<CatalogItemDocument>(tenantId, CATALOG_ITEM_MODEL_NAME)
    }

    private modelByName<T>(tenantId: string, modelName: string): Model<T> {
        const model = this.registry.getModelMap<T>(modelName).get(tenantId)

        if (!model) {
            throw new Error(`No model for tenant "${tenantId}"`)
        }

        return model
    }

    private toPublicSession(session: any) {
        const id = session._id?.toString?.() ?? session.id

        return {
            id,
            status: session.status,
            customer: session.customer,
            roomBookings: session.roomBookings ?? [],
            productLines: session.productLines ?? [],
            startedAt: session.startedAt,
            closedAt: session.closedAt,
            receipt: session.receipt,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        }
    }

    private toPublicReceipt(session: any) {
        const publicSession = this.toPublicSession(session)

        return {
            id: publicSession.id,
            sessionId: publicSession.id,
            customer: publicSession.customer,
            startedAt: publicSession.startedAt,
            closedAt: publicSession.closedAt,
            receipt: publicSession.receipt,
            createdAt: publicSession.createdAt,
            updatedAt: publicSession.updatedAt,
        }
    }
}
