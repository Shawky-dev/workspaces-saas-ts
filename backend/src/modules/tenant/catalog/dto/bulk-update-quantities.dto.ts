import { Type } from 'class-transformer'
import {
    ArrayNotEmpty,
    IsArray,
    IsInt,
    IsMongoId,
    Min,
    ValidateNested,
} from 'class-validator'

export class BulkQuantityItemDto {
    @IsMongoId()
    id!: string

    @Type(() => Number)
    @IsInt()
    @Min(0)
    quantityOnHand!: number
}

export class BulkUpdateQuantitiesDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BulkQuantityItemDto)
    items!: BulkQuantityItemDto[]
}
