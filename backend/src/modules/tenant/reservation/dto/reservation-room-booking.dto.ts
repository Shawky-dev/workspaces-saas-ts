import { Type } from 'class-transformer'
import { IsInt, IsMongoId, IsOptional, Min } from 'class-validator'

export class ReservationRoomBookingDto {
    @IsMongoId()
    roomId!: string

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    seatCount?: number
}
