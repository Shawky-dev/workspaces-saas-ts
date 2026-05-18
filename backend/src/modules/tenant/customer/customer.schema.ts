import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class Customer {
    @Prop({
        required: true,
        trim: true,
    })
    firstName!: string

    @Prop({
        required: true,
        trim: true,
    })
    lastName!: string

    @Prop({
        required: true,
        trim: true,
    })
    phoneNumber!: string

    @Prop({
        trim: true,
    })
    email?: string

    @Prop({
        trim: true,
    })
    notes?: string

    @Prop({
        default: false,
    })
    isBlocked!: boolean
}

export type CustomerDocument = Customer & Document

export const CustomerSchema = SchemaFactory.createForClass(Customer)

export const CUSTOMER_MODEL_NAME = Customer.name