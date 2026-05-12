import { IsBoolean, IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateTenantDto {
    @IsString()
    @IsNotEmpty()
    slug!: string

    @IsString()
    @IsNotEmpty()
    name!: string

    @IsBoolean()
    @IsOptional()
    enabled?: boolean

    @IsString()
    @IsNotEmpty()
    adminName!: string

    @IsEmail()
    adminEmail!: string

    @IsString()
    @MinLength(6)
    adminPassword!: string
}
