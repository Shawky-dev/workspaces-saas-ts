import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class Tenant {

    @Prop({ required: true, unique: true })
    slug!: string

    @Prop({ required: true })
    name!: string

    @Prop({ required: true })
    mongoUri!: string

    @Prop({ default: true })
    enabled!: boolean
}

export type TenantDocument = Tenant & Document
export const TenantSchema = SchemaFactory.createForClass(Tenant)
export const TENANT_MODEL_NAME = Tenant.name
