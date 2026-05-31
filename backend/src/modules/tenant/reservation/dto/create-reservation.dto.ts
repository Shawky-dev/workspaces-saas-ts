import { Type } from 'class-transformer'
import {
    ArrayNotEmpty,
    IsArray,
    IsDateString,
    IsMongoId,
    ValidateIf,
    ValidateNested,
} from 'class-validator'
import { ReservationCustomerDto } from './reservation-customer.dto'
import { ReservationRoomBookingDto } from './reservation-room-booking.dto'

export class CreateReservationDto {
    @ValidateIf((dto) => !dto.customer)
    @IsMongoId()
    customerId?: string

    @ValidateIf((dto) => !dto.customerId)
    @ValidateNested()
    @Type(() => ReservationCustomerDto)
    customer?: ReservationCustomerDto

    @IsDateString()
    startsAt!: string

    @IsDateString()
    endsAt!: string

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => ReservationRoomBookingDto)
    roomBookings!: ReservationRoomBookingDto[]
}
