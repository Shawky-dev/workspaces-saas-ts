import {
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator'

export class UpdateRoomDto {
    @IsOptional()
    @IsString()
    name?: string

    @IsOptional()
    @IsString()
    type?: string

    @IsOptional()
    @IsNumber()
    ratePerHour?: number

    @IsOptional()
    @IsNumber()
    seats?: number
}