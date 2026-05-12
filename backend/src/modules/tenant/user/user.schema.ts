import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class User {
    @Prop({
        required: true,
        unique: true,
        index: true,
    })
    email!: string

    @Prop({ required: true })
    password!: string

    @Prop({ required: true })
    name!: string

    @Prop({
        default: 'admin',
    })
    role!: string
}

export type UserDocument = User & Document

export const UserSchema =
    SchemaFactory.createForClass(User)

export const USER_MODEL_NAME = User.name
