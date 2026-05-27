import {
    IsBoolean,
    IsEmail,
    IsOptional,
    IsString,
} from 'class-validator'

export class UpdateCustomerDto {
    @IsOptional()
    @IsString()
    firstName?: string

    @IsOptional()
    @IsString()
    lastName?: string

    @IsOptional()
    @IsString()
    phoneNumber?: string

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