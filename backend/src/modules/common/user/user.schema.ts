import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { Role } from '../../auth/enums/role.enum'
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

    @Prop({type: [String], enum: Role, default: [Role.USER],})
    roles: Role[]

}

export type UserDocument = User & Document

export const UserSchema =
    SchemaFactory.createForClass(User)

UserSchema.pre('save', async function () {
    // only hash if password changed
    if (!this.isModified('password')) {
        return
    }

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

export const USER_MODEL_NAME = User.name
