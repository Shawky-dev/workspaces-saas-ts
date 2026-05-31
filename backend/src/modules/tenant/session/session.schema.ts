import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { RoomType } from '../room/room.schema'

export enum SessionStatus {
    ACTIVE = 'active',
    CLOSED = 'closed',
}

export enum PaymentStatus {
    PAID = 'paid',
    UNPAID = 'unpaid',
    PARTIAL = 'partial',
}

export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    WALLET = 'wallet',
    BANK_TRANSFER = 'bank_transfer',
    MIXED = 'mixed',
    OTHER = 'other',
}

@Schema({ _id: false })
export class SessionCustomerSnapshot {
    @Prop({ required: true })
    customerId!: string

    @Prop({ required: true })
    firstName!: string

    @Prop({ required: true })
    lastName!: string

    @Prop({ required: true })
    phoneNumber!: string

    @Prop()
    email?: string
}

@Schema({ _id: false })
export class SessionRoomBooking {
    @Prop({ required: true })
    roomId!: string

    @Prop({ required: true })
    roomName!: string

    @Prop({ required: true, enum: RoomType })
    type!: RoomType

    @Prop({ required: true, min: 0 })
    ratePerHour!: number

    @Prop({ required: true, min: 1 })
    seatCount!: number
}

@Schema({ _id: false })
export class SessionProductLine {
    @Prop({ required: true })
    catalogItemId!: string

    @Prop({ required: true })
    name!: string

    @Prop({ required: true, min: 0 })
    unitPrice!: number

    @Prop({ required: true, min: 1 })
    quantity!: number
}

@Schema({ _id: false })
export class SessionReceipt {
    @Prop({ required: true, min: 0 })
    billableMinutes!: number

    @Prop({ required: true, min: 0 })
    roomSubtotal!: number

    @Prop({ required: true, min: 0 })
    productsSubtotal!: number

    @Prop({ required: true, min: 0 })
    discount!: number

    @Prop({ required: true, min: 0 })
    total!: number

    @Prop({ required: true, enum: PaymentStatus })
    paymentStatus!: PaymentStatus

    @Prop({ required: true, enum: PaymentMethod })
    paymentMethod!: PaymentMethod

    @Prop({ type: [SessionRoomBooking], default: [] })
    roomBookings!: SessionRoomBooking[]

    @Prop({ type: [SessionProductLine], default: [] })
    productLines!: SessionProductLine[]
}

const SessionCustomerSnapshotSchema = raw({
    customerId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
})

const SessionRoomBookingSchema = raw({
    roomId: { type: String, required: true },
    roomName: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: Object.values(RoomType),
    },
    ratePerHour: { type: Number, required: true, min: 0 },
    seatCount: { type: Number, required: true, min: 1 },
})

const SessionProductLineSchema = raw({
    catalogItemId: { type: String, required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
})

const SessionReceiptSchema = raw({
    billableMinutes: { type: Number, required: true, min: 0 },
    roomSubtotal: { type: Number, required: true, min: 0 },
    productsSubtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: {
        type: String,
        required: true,
        enum: Object.values(PaymentStatus),
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: Object.values(PaymentMethod),
    },
    roomBookings: { type: [SessionRoomBookingSchema], default: [] },
    productLines: { type: [SessionProductLineSchema], default: [] },
})

@Schema({ timestamps: true })
export class Session {
    @Prop({ required: true, enum: SessionStatus, default: SessionStatus.ACTIVE, index: true })
    status!: SessionStatus

    @Prop({ required: true, type: SessionCustomerSnapshotSchema })
    customer!: SessionCustomerSnapshot

    @Prop({ required: true, type: [SessionRoomBookingSchema] })
    roomBookings!: SessionRoomBooking[]

    @Prop({ type: [SessionProductLineSchema], default: [] })
    productLines!: SessionProductLine[]

    @Prop({ required: true, default: Date.now })
    startedAt!: Date

    @Prop()
    closedAt?: Date

    @Prop({ type: SessionReceiptSchema })
    receipt?: SessionReceipt
}

export type SessionDocument = Session & Document

export const SessionSchema = SchemaFactory.createForClass(Session)
export const SESSION_MODEL_NAME = Session.name
