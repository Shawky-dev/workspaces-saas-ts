import { IsEmail, IsString, MinLength } from 'class-validator'

/**
 * Request body for logging in a platform-level user from the shared common database.
 */
export class CommonLoginDto {
    @IsEmail()
    email!: string

    @IsString()
    @MinLength(6)
    password!: string
}
