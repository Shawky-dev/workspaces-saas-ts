import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class CatalogItem {
    @Prop({
        required: true,
        trim: true,
    })
    name!: string

    @Prop({
        required: true,
        min: 0,
    })
    purchasePrice!: number

    @Prop({
        required: true,
        min: 0,
    })
    soldPrice!: number

    @Prop({
        default: '',
        trim: true,
    })
    description!: string

    @Prop({ type: Buffer })
    imageData?: Buffer

    @Prop()
    imageContentType?: string

    @Prop()
    imageOriginalName?: string

    @Prop()
    imageSize?: number
}

export type CatalogItemDocument = CatalogItem & Document

export const CatalogItemSchema = SchemaFactory.createForClass(CatalogItem)
export const CATALOG_ITEM_MODEL_NAME = CatalogItem.name
