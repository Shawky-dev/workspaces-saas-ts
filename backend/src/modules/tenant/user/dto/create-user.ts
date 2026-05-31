import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator'
import { TenantUserRole } from '../role.enum'

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name!: string

    @IsEmail()
    email!: string

    @IsString()
    @MinLength(6)
    password!: string

    @IsEnum(TenantUserRole)
    @IsOptional()
    role?: TenantUserRole
}
