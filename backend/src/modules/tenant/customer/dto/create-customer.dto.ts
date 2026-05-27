import {
    IsBoolean,
    IsEmail,
    IsOptional,
    IsString,
} from 'class-validator'

export class CreateCustomerDto {
    @IsString()
    firstName!: string

    @IsString()
    lastName!: string

    @IsString()
    phoneNumber!: string

    @IsOptional()
    @IsEmail()
    email?: string

    @IsOptional()
    @IsString()
    notes?: string

    @IsOptional()
    @IsBoolean()
    isBlocked?: boolean
}