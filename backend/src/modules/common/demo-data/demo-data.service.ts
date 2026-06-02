import { Inject, Injectable } from '@nestjs/common'
import {
    TENANT_CONNECTION_REGISTRY,
    TENANT_MODEL_REGISTRY,
} from '@phen0menon/nestjs-mongoose-tenancy'
import type { TenantModelRegistry } from '@phen0menon/nestjs-mongoose-tenancy'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { extname, join, resolve } from 'path'
import { Model } from 'mongoose'
import { TenantBootstrapService } from '../tenants/bootstrap/bootstrap.service'
import { TenantService } from '../tenants/tenant.service'
import { TenantUserRole } from 'src/modules/tenant/user/role.enum'
import {
    CATALOG_ITEM_MODEL_NAME,
    CatalogItemDocument,
} from 'src/modules/tenant/catalog/catalog-item.schema'
import {
    CUSTOMER_MODEL_NAME,
    CustomerDocument,
} from 'src/modules/tenant/customer/customer.schema'
import {
    RESERVATION_MODEL_NAME,
    ReservationDocument,
    ReservationStatus,
} from 'src/modules/tenant/reservation/reservation.schema'
import {
    RESERVATION_SETTINGS_MODEL_NAME,
    ReservationSettingsDocument,
} from 'src/modules/tenant/reservation/reservation-settings.schema'
import { ROOM_MODEL_NAME, RoomDocument, RoomType } from 'src/modules/tenant/room/room.schema'
import {
    PaymentMethod,
    PaymentStatus,
    SESSION_MODEL_NAME,
    SessionDocument,
    SessionStatus,
} from 'src/modules/tenant/session/session.schema'

const ADMIN_PASSWORD = 'Password123!'
const DAY_MS = 24 * 60 * 60 * 1000

type DemoTenant = {
    slug: string
    name: string
    adminName: string
    adminEmail: string
}

type SeedSummary = {
    tenant: string
    createdTenant: boolean
    rooms: number
    products: number
    productImages: number
    customers: number
    receipts: number
    activeSessions: number
    reservations: number
}

type ProductSeed = {
    name: string
    category: string
    purchasePrice: number
    soldPrice: number
    description: string
    quantityOnHand: number
}

@Injectable()
export class DemoDataService {
    private readonly tenants: DemoTenant[] = [
        {
            slug: 'workspace-on-us',
            name: 'WorkSpaceOnUs',
            adminName: 'WorkSpaceOnUs Admin',
            adminEmail: 'admin@workspaceonus.test',
        },
        {
            slug: 'comfort-zone',
            name: 'ComfortZone',
            adminName: 'ComfortZone Admin',
            adminEmail: 'admin@comfortzone.test',
        },
    ]

    constructor(
        private readonly tenantService: TenantService,
        private readonly bootstrapService: TenantBootstrapService,
        @Inject(TENANT_CONNECTION_REGISTRY)
        private readonly connectionRegistry: any,
        @Inject(TENANT_MODEL_REGISTRY)
        private readonly modelRegistry: TenantModelRegistry,
    ) { }

    async load() {
        const imageCatalog = this.loadProductImages()
        const summaries: SeedSummary[] = []

        for (const tenant of this.tenants) {
            const createdTenant = await this.ensureTenant(tenant)
            await this.ensureAdmin(tenant)

            const rooms = await this.seedRooms(tenant.slug)
            const products = await this.seedProducts(tenant.slug, imageCatalog)
            const customers = await this.seedCustomers(tenant.slug)
            await this.seedReservationSettings(tenant.slug)
            const receipts = await this.seedReceipts(tenant.slug, customers, rooms, products)
            const activeSessions = await this.seedActiveSessions(tenant.slug, customers, rooms, products)
            const reservations = await this.seedReservations(tenant.slug, customers, rooms)

            summaries.push({
                tenant: tenant.slug,
                createdTenant,
                rooms: rooms.length,
                products: products.length,
                productImages: products.filter((product: any) => product.imageContentType).length,
                customers: customers.length,
                receipts,
                activeSessions,
                reservations,
            })
        }

        return {
            message: 'Demo data loaded',
            tenants: summaries,
            productImageDirectory: this.productImageDirectories()[0],
        }
    }

    private async ensureTenant(tenant: DemoTenant) {
        const tenants = await this.tenantService.getAllTenants()
        const existing = tenants.find((candidate: any) => candidate.slug === tenant.slug)

        if (existing) {
            await this.ensureTenantConnection(tenant.slug, existing.mongoUri)
            return false
        }

        await this.tenantService.createTenant({
            slug: tenant.slug,
            name: tenant.name,
            enabled: true,
            adminName: tenant.adminName,
            adminEmail: tenant.adminEmail,
            adminPassword: ADMIN_PASSWORD,
        })

        return true
    }

    private async ensureTenantConnection(slug: string, storedMongoUri?: string) {
        if (this.connectionRegistry.hasTenant(slug)) {
            return
        }

        const mongoUri = storedMongoUri ?? `${process.env.MONGO_BASE_URI}/${slug}`
        await this.connectionRegistry.connectTenant({ id: slug, uri: mongoUri })
        this.connectionRegistry.tenantConnections.push({ id: slug, uri: mongoUri })
    }

    private async ensureAdmin(tenant: DemoTenant) {
        await this.bootstrapService.run(tenant.slug, {
            user: {
                admin: {
                    email: tenant.adminEmail,
                    name: tenant.adminName,
                    password: ADMIN_PASSWORD,
                    role: TenantUserRole.SUPER_ADMIN,
                },
            },
        })
    }

    private async seedRooms(tenantId: string) {
        const seeds = [
            { name: 'Focus Room 1', type: RoomType.PRIVATE, ratePerHour: 90, seats: 1 },
            { name: 'Focus Room 2', type: RoomType.PRIVATE, ratePerHour: 100, seats: 1 },
            { name: 'Podcast Room', type: RoomType.PRIVATE, ratePerHour: 140, seats: 1 },
            { name: 'Meeting Suite', type: RoomType.PRIVATE, ratePerHour: 180, seats: 1 },
            { name: 'Open Desk Area', type: RoomType.PUBLIC, ratePerHour: 35, seats: 14 },
            { name: 'Quiet Shared Zone', type: RoomType.PUBLIC, ratePerHour: 45, seats: 10 },
        ]
        const model = this.modelFor<RoomDocument>(ROOM_MODEL_NAME, tenantId)

        for (const seed of seeds) {
            await model.updateOne(
                { name: seed.name },
                { $set: seed },
                { upsert: true },
            )
        }

        return model.find({ name: { $in: seeds.map((seed) => seed.name) } }).lean()
    }

    private async seedProducts(tenantId: string, imageCatalog: Map<string, DemoImage>) {
        const seeds: ProductSeed[] = [
            this.product('Classic Chips', 'chips', 12, 25, 48),
            this.product('BBQ Chips', 'chips', 13, 28, 42),
            this.product('Tortilla Chips', 'chips', 14, 30, 36),
            this.product('Cola Soda', 'soda', 10, 22, 60),
            this.product('Lemon Soda', 'soda', 9, 20, 54),
            this.product('Orange Soda', 'soda', 9, 20, 50),
            this.product('Mixed Snacks Box', 'snacks', 25, 55, 28),
            this.product('Chocolate Bar', 'snacks', 11, 24, 45),
            this.product('Granola Snack', 'snacks', 15, 32, 34),
            this.product('Hot Coffee', 'coffee', 16, 38, 80),
            this.product('Ice Tea', 'ice-tea', 14, 34, 46),
            this.product('Ice Coffee', 'ice-coffee', 20, 48, 40),
        ]
        const model = this.modelFor<CatalogItemDocument>(CATALOG_ITEM_MODEL_NAME, tenantId)

        for (const seed of seeds) {
            const image = imageCatalog.get(seed.category)
            await model.updateOne(
                { name: seed.name },
                {
                    $set: {
                        ...seed,
                        ...(image ? {
                            imageData: image.buffer,
                            imageContentType: image.contentType,
                            imageOriginalName: image.originalName,
                            imageSize: image.size,
                        } : {}),
                    },
                },
                { upsert: true },
            )
        }

        return model.find({ name: { $in: seeds.map((seed) => seed.name) } }).lean()
    }

    private product(name: string, category: string, purchasePrice: number, soldPrice: number, quantityOnHand: number): ProductSeed {
        return {
            name,
            category,
            purchasePrice,
            soldPrice,
            quantityOnHand,
            description: `${name} demo inventory item`,
        }
    }

    private async seedCustomers(tenantId: string) {
        const firstNames = [
            'Omar', 'Mona', 'Youssef', 'Nour', 'Ali',
            'Salma', 'Karim', 'Farah', 'Hassan', 'Laila',
            'Mostafa', 'Hana', 'Ahmed', 'Dina', 'Mahmoud',
            'Nada', 'Tamer', 'Mariam', 'Khaled', 'Rana',
        ]
        const lastNames = [
            'Hassan', 'Maher', 'Saleh', 'Fouad', 'Amin',
            'Nabil', 'Samir', 'Adel', 'Rashed', 'Kamal',
            'Mansour', 'Latif', 'Farouk', 'Younis', 'Saber',
            'Helmy', 'Gaber', 'Sherif', 'Tarek', 'Zaki',
        ]
        const model = this.modelFor<CustomerDocument>(CUSTOMER_MODEL_NAME, tenantId)

        for (let index = 0; index < firstNames.length; index++) {
            const phoneNumber = `+201000${tenantId === 'workspace-on-us' ? '10' : '20'}${String(index + 1).padStart(2, '0')}`
            await model.updateOne(
                { phoneNumber },
                {
                    $set: {
                        firstName: firstNames[index],
                        lastName: lastNames[index],
                        phoneNumber,
                        email: `${firstNames[index].toLowerCase()}.${lastNames[index].toLowerCase()}@demo.test`,
                        notes: `Demo customer ${index + 1}`,
                        isBlocked: false,
                    },
                },
                { upsert: true },
            )
        }

        return model.find({ phoneNumber: { $regex: tenantId === 'workspace-on-us' ? '\\+20100010' : '\\+20100020' } }).lean()
    }

    private async seedReservationSettings(tenantId: string) {
        const model = this.modelFor<ReservationSettingsDocument>(RESERVATION_SETTINGS_MODEL_NAME, tenantId)
        await model.updateOne(
            {},
            {
                $set: {
                    timezone: 'Africa/Cairo',
                    slotMinutes: 30,
                    weeklyHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({
                        dayOfWeek,
                        enabled: dayOfWeek >= 0 && dayOfWeek <= 6,
                        opensAt: '08:00',
                        closesAt: '22:00',
                    })),
                },
            },
            { upsert: true },
        )
    }

    private async seedReceipts(tenantId: string, customers: any[], rooms: any[], products: any[]) {
        const model = this.modelFor<SessionDocument>(SESSION_MODEL_NAME, tenantId)
        const demoCustomers = customers.slice(0, 16)

        for (let index = 0; index < 40; index++) {
            const customer = demoCustomers[index % demoCustomers.length]
            const startedAt = this.pastDate(index + 2, 9 + (index % 8), (index % 4) * 15)
            const durationMinutes = 45 + (index % 7) * 15
            const closedAt = new Date(startedAt.getTime() + durationMinutes * 60000)
            const room = rooms[index % rooms.length]
            const productLines = this.productLines(products, index)
            const roomBookings = [this.roomBooking(room, room.type === RoomType.PUBLIC ? 1 + (index % 3) : 1)]
            const billableMinutes = Math.max(15, Math.floor(durationMinutes / 15) * 15)
            const roomSubtotal = this.roomSubtotal(roomBookings, billableMinutes)
            const productsSubtotal = productLines.reduce((total, line) => total + line.unitPrice * line.quantity, 0)
            const discount = index % 9 === 0 ? 10 : 0
            const total = Math.max(0, roomSubtotal + productsSubtotal - discount)

            await model.updateOne(
                {
                    status: SessionStatus.CLOSED,
                    'customer.phoneNumber': customer.phoneNumber,
                    startedAt,
                },
                {
                    $set: {
                        status: SessionStatus.CLOSED,
                        customer: this.customerSnapshot(customer),
                        roomBookings,
                        productLines,
                        startedAt,
                        closedAt,
                        receipt: {
                            billableMinutes,
                            roomSubtotal,
                            productsSubtotal,
                            discount,
                            total,
                            paymentStatus: index % 13 === 0 ? PaymentStatus.PARTIAL : PaymentStatus.PAID,
                            paymentMethod: this.paymentMethod(index),
                            roomBookings,
                            productLines,
                        },
                    },
                },
                { upsert: true },
            )
        }

        return 40
    }

    private async seedActiveSessions(tenantId: string, customers: any[], rooms: any[], products: any[]) {
        const model = this.modelFor<SessionDocument>(SESSION_MODEL_NAME, tenantId)
        const privateRooms = rooms.filter((room) => room.type === RoomType.PRIVATE)
        const publicRooms = rooms.filter((room) => room.type === RoomType.PUBLIC)
        const activeSeeds = [
            { customer: customers[17], room: privateRooms[0], seatCount: 1, minutesAgo: 35 },
            { customer: customers[18], room: privateRooms[1], seatCount: 1, minutesAgo: 80 },
            { customer: customers[19], room: publicRooms[0], seatCount: 2, minutesAgo: 25 },
        ]

        for (let index = 0; index < activeSeeds.length; index++) {
            const seed = activeSeeds[index]
            await model.updateOne(
                {
                    status: SessionStatus.ACTIVE,
                    'customer.phoneNumber': seed.customer.phoneNumber,
                },
                {
                    $set: {
                        status: SessionStatus.ACTIVE,
                        customer: this.customerSnapshot(seed.customer),
                        roomBookings: [this.roomBooking(seed.room, seed.seatCount)],
                        productLines: this.productLines(products, index + 50),
                        startedAt: new Date(Date.now() - seed.minutesAgo * 60000),
                    },
                    $unset: {
                        closedAt: '',
                        receipt: '',
                    },
                },
                { upsert: true },
            )
        }

        return activeSeeds.length
    }

    private async seedReservations(tenantId: string, customers: any[], rooms: any[]) {
        const model = this.modelFor<ReservationDocument>(RESERVATION_MODEL_NAME, tenantId)
        const privateRooms = rooms.filter((room) => room.type === RoomType.PRIVATE)
        const publicRooms = rooms.filter((room) => room.type === RoomType.PUBLIC)

        for (let index = 0; index < 8; index++) {
            const startsAt = this.futureDate(1 + Math.floor(index / 2), 10 + (index % 4) * 2, 0)
            const endsAt = new Date(startsAt.getTime() + 60 * 60000)
            const room = index % 3 === 0 ? publicRooms[index % publicRooms.length] : privateRooms[index % privateRooms.length]
            const customer = customers[index]
            await model.updateOne(
                {
                    status: ReservationStatus.SCHEDULED,
                    'customer.phoneNumber': customer.phoneNumber,
                    startsAt,
                },
                {
                    $set: {
                        status: ReservationStatus.SCHEDULED,
                        customer: this.customerSnapshot(customer),
                        roomBookings: [this.roomBooking(room, room.type === RoomType.PUBLIC ? 2 : 1)],
                        startsAt,
                        endsAt,
                    },
                    $unset: {
                        arrivedAt: '',
                        sessionId: '',
                        canceledAt: '',
                        cancelReason: '',
                    },
                },
                { upsert: true },
            )
        }

        return 8
    }

    private productLines(products: any[], offset: number) {
        return [0, 1].map((step) => {
            const product = products[(offset + step) % products.length]
            return {
                catalogItemId: product._id.toString(),
                name: product.name,
                unitPrice: product.soldPrice,
                quantity: 1 + ((offset + step) % 2),
            }
        })
    }

    private roomBooking(room: any, seatCount: number) {
        return {
            roomId: room._id.toString(),
            roomName: room.name,
            type: room.type,
            ratePerHour: room.ratePerHour,
            seatCount,
        }
    }

    private customerSnapshot(customer: any) {
        return {
            customerId: customer._id.toString(),
            firstName: customer.firstName,
            lastName: customer.lastName,
            phoneNumber: customer.phoneNumber,
            email: customer.email,
        }
    }

    private roomSubtotal(roomBookings: any[], billableMinutes: number) {
        const hours = billableMinutes / 60
        return roomBookings.reduce((total, booking) => total + booking.ratePerHour * booking.seatCount * hours, 0)
    }

    private paymentMethod(index: number) {
        const methods = [
            PaymentMethod.CASH,
            PaymentMethod.CARD,
            PaymentMethod.WALLET,
            PaymentMethod.BANK_TRANSFER,
            PaymentMethod.MIXED,
        ]

        return methods[index % methods.length]
    }

    private pastDate(daysAgo: number, hour: number, minute: number) {
        const date = new Date()
        date.setHours(hour, minute, 0, 0)
        return new Date(date.getTime() - daysAgo * DAY_MS)
    }

    private futureDate(daysAhead: number, hour: number, minute: number) {
        const date = new Date()
        date.setHours(hour, minute, 0, 0)
        return new Date(date.getTime() + daysAhead * DAY_MS)
    }

    private modelFor<T>(modelName: string, tenantId: string): Model<T> {
        const model = this.modelRegistry.getModelMap<T>(modelName).get(tenantId)

        if (!model) {
            throw new Error(`No model "${modelName}" for tenant "${tenantId}"`)
        }

        return model
    }

    private loadProductImages() {
        const images = new Map<string, DemoImage>()
        const directory = this.productImageDirectories().find((path) => existsSync(path))

        if (!directory) {
            return images
        }

        const files = readdirSync(directory)

        for (const category of ['chips', 'soda', 'snacks', 'coffee', 'ice-tea', 'ice-coffee']) {
            const file = files.find((name) => {
                const extension = extname(name).toLowerCase()
                const basename = name.slice(0, -extension.length).toLowerCase()
                return basename === category && ['.png', '.jpg', '.jpeg', '.webp'].includes(extension)
            })

            if (!file) {
                continue
            }

            const fullPath = join(directory, file)
            const buffer = readFileSync(fullPath)
            images.set(category, {
                buffer,
                contentType: this.contentTypeFor(file),
                originalName: file,
                size: buffer.length,
            })
        }

        return images
    }

    private productImageDirectories() {
        return [
            resolve(process.cwd(), 'dummy_products'),
            resolve(process.cwd(), '..', 'dummy_products'),
        ]
    }

    private contentTypeFor(fileName: string) {
        const extension = extname(fileName).toLowerCase()

        if (extension === '.png') {
            return 'image/png'
        }

        if (extension === '.webp') {
            return 'image/webp'
        }

        return 'image/jpeg'
    }
}

type DemoImage = {
    buffer: Buffer
    contentType: string
    originalName: string
    size: number
}
