import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator'

export class ReservationCustomerDto {
    @IsString()
    @IsNotEmpty()
    firstName!: string

    @IsString()
    @IsNotEmpty()
    lastName!: string

    @IsString()
    @IsNotEmpty()
    phoneNumber!: string

    @IsOptional()
    @IsEmail()
    email?: string
}
