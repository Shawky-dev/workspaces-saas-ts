import { Type } from 'class-transformer'
import { IsInt } from 'class-validator'

export class AdjustQuantityDto {
    @Type(() => Number)
    @IsInt()
    delta!: number
}
