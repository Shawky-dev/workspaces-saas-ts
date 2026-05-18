import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { RoomType } from '../room.schema'

export class CreateRoomDto {
    @IsString()
    name!: string

    @IsEnum(RoomType)
    type!: RoomType

    @IsNumber()
    @Min(0)
    ratePerHour!: number

    @IsOptional()
    @IsNumber()
    @Min(1)
    seats?: number
}