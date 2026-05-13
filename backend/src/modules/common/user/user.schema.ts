import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
/**
 * Mongoose schema for a **platform-level user** stored in the common database.
 *
 * A `CommonUser` represents a person who has registered on the platform. They
 * exist independently of any workspace/tenant. Contrast with
 * {@link TenantUser} (in `modules/tenant/user`) which is scoped to a specific
 * workspace and holds workspace-specific roles and data.
 */
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
