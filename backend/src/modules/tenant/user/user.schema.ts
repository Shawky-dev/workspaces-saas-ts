import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { Role } from '../../auth/enums/role.enum'

/**
 * Mongoose schema for a **tenant-scoped user** stored in a workspace database.
 *
 * A `TenantUser` lives inside a specific tenant's isolated database
 * (`workspace_saas_{tenantId}`). They represent a member of that workspace.
 * Contrast with {@link CommonUser} (in `modules/common/user`) which is a
 * platform-level identity.
 *
 * The schema shape is intentionally similar to `CommonUser` — in a future
 * auth flow, a `CommonUser` login would resolve to a `TenantUser` record
 * to determine workspace-specific permissions.
 */
@Schema({ timestamps: true })
export class User {
    /** The user's email address. Unique within this tenant's database. */
    @Prop({
        required: true,
        unique: true,
        index: true,
    })
    email!: string

    /** Hashed password. Never return this field in API responses. */
    @Prop({ required: true })
    password!: string

    /** Display name of the user within this workspace. */
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
