import { Type } from 'class-transformer'
import {
    IsNotEmpty,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator'

export class CreateCatalogItemDto {
    @IsString()
    @IsNotEmpty()
    name!: string

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    purchasePrice!: number

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    soldPrice!: number

    @IsString()
    @IsOptional()
    description?: string

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @IsOptional()
    quantityOnHand?: number
}
