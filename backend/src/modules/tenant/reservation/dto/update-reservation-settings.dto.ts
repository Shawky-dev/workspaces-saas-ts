import { Type } from 'class-transformer'
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator'

export class WeeklyReservationHoursDto {
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek!: number

    @IsBoolean()
    enabled!: boolean

    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    opensAt!: string

    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    closesAt!: string
}

export class UpdateReservationSettingsDto {
    @IsOptional()
    @IsString()
    timezone?: string

    @Type(() => Number)
    @IsInt()
    @Min(15)
    @Max(240)
    slotMinutes!: number

    @IsArray()
    @ArrayMinSize(7)
    @ValidateNested({ each: true })
    @Type(() => WeeklyReservationHoursDto)
    weeklyHours!: WeeklyReservationHoursDto[]
}
