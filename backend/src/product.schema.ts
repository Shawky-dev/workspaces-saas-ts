import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema()
export class Product {
    @Prop()
    value: string
}

export type ProductDocument = Product & Document
export const ProductSchema = SchemaFactory.createForClass(Product)
export const PRODUCT_MODEL_NAME = Product.name
