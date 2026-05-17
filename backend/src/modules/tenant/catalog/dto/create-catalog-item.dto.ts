import { Type } from 'class-transformer'
import {
    IsNotEmpty,
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
}
