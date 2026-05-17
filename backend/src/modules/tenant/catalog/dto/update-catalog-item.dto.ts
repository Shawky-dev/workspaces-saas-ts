import { Type } from 'class-transformer'
import {
    IsNotEmpty,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator'

export class UpdateCatalogItemDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    purchasePrice?: number

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    soldPrice?: number

    @IsString()
    @IsOptional()
    description?: string

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @IsOptional()
    quantityOnHand?: number
}
