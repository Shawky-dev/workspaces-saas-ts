import {
    IsBoolean,
    IsOptional,
    IsString,
} from 'class-validator'

export class UpdateTenantDto {
    @IsString()
    @IsOptional()
    name?: string

    @IsBoolean()
    @IsOptional()
    enabled?: boolean
}
