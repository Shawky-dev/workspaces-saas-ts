import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { RoomType } from '../room/room.schema'

export enum ReservationStatus {
    SCHEDULED = 'scheduled',
    ARRIVED = 'arrived',
    CANCELED = 'canceled',
}

@Schema({ _id: false })
export class ReservationCustomerSnapshot {
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
export class ReservationRoomBooking {
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

const ReservationCustomerSnapshotSchema = raw({
    customerId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
})

export const ReservationRoomBookingSchema = raw({
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

@Schema({ timestamps: true })
export class Reservation {
    @Prop({ required: true, enum: ReservationStatus, default: ReservationStatus.SCHEDULED, index: true })
    status!: ReservationStatus

    @Prop({ required: true, type: ReservationCustomerSnapshotSchema })
    customer!: ReservationCustomerSnapshot

    @Prop({ required: true, type: [ReservationRoomBookingSchema] })
    roomBookings!: ReservationRoomBooking[]

    @Prop({ required: true, index: true })
    startsAt!: Date

    @Prop({ required: true, index: true })
    endsAt!: Date

    @Prop()
    arrivedAt?: Date

    @Prop()
    sessionId?: string

    @Prop()
    canceledAt?: Date

    @Prop()
    cancelReason?: string
}

export type ReservationDocument = Reservation & Document
export const ReservationSchema = SchemaFactory.createForClass(Reservation)
export const RESERVATION_MODEL_NAME = Reservation.name
