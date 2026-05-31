import { Type } from 'class-transformer'
import {
    IsArray,
    IsInt,
    IsMongoId,
    Min,
    ValidateNested,
} from 'class-validator'

export class UpdateSessionProductLineDto {
    @IsMongoId()
    catalogItemId!: string

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity!: number
}

export class UpdateSessionProductsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateSessionProductLineDto)
    products!: UpdateSessionProductLineDto[]
}
