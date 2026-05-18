import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum RoomType {
    PRIVATE = 'private',
    PUBLIC = 'public',
}

@Schema({ timestamps: true })
export class Room {
    @Prop({
        required: true,
        trim: true,
    })
    name!: string

    @Prop({
        required: true,
        enum: RoomType,
    })
    type!: RoomType

    @Prop({
        required: true,
        min: 0,
    })
    ratePerHour!: number

    @Prop({
        min: 1,
    })
    seats?: number
}

export type RoomDocument = Room & Document

export const RoomSchema = SchemaFactory.createForClass(Room)
export const ROOM_MODEL_NAME = Room.name