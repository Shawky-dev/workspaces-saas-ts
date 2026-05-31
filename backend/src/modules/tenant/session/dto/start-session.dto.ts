import { Type } from 'class-transformer'
import {
    ArrayNotEmpty,
    IsArray,
    IsEmail,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
    IsInt,
    ValidateIf,
} from 'class-validator'

export class QuickCreateSessionCustomerDto {
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

export class StartSessionRoomBookingDto {
    @IsMongoId()
    roomId!: string

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    seatCount?: number
}

export class StartSessionDto {
    @ValidateIf((dto) => !dto.customer)
    @IsMongoId()
    customerId?: string

    @ValidateIf((dto) => !dto.customerId)
    @ValidateNested()
    @Type(() => QuickCreateSessionCustomerDto)
    customer?: QuickCreateSessionCustomerDto

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => StartSessionRoomBookingDto)
    roomBookings!: StartSessionRoomBookingDto[]
}
