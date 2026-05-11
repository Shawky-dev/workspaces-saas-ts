import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateTenantDto {

    @IsString()
    @IsNotEmpty()
    slug!: string

    @IsString()
    @IsNotEmpty()
    name!: string

    @IsString()
    @IsNotEmpty()
    mongoUri!: string

    @IsBoolean()
    @IsOptional()
    enabled?: boolean
}
