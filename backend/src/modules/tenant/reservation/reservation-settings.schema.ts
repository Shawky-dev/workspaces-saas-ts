import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ _id: false })
export class WeeklyReservationHours {
    @Prop({ required: true, min: 0, max: 6 })
    dayOfWeek!: number

    @Prop({ required: true, default: false })
    enabled!: boolean

    @Prop({ required: true })
    opensAt!: string

    @Prop({ required: true })
    closesAt!: string
}

const WeeklyReservationHoursSchema = raw({
    _id: false,
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    enabled: { type: Boolean, required: true, default: false },
    opensAt: { type: String, required: true },
    closesAt: { type: String, required: true },
})

@Schema({ timestamps: true })
export class ReservationSettings {
    @Prop({ required: true, default: 'Africa/Cairo' })
    timezone!: string

    @Prop({ required: true, default: 30, min: 15 })
    slotMinutes!: number

    @Prop({ required: true, type: [WeeklyReservationHoursSchema], default: [] })
    weeklyHours!: WeeklyReservationHours[]
}

export type ReservationSettingsDocument = ReservationSettings & Document
export const ReservationSettingsSchema = SchemaFactory.createForClass(ReservationSettings)
export const RESERVATION_SETTINGS_MODEL_NAME = ReservationSettings.name
