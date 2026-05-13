import { IsEmail, IsString, MinLength } from 'class-validator'

/**
 * Request body for logging in a tenant-scoped user within a specific workspace.
 */
export class TenantLoginDto {
    @IsEmail()
    email!: string

    @IsString()
    @MinLength(6)
    password!: string
}
