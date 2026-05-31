import { Type } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator'
import { PaymentMethod, PaymentStatus } from '../session.schema'

export class CloseSessionDto {
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    discount?: number

    @IsEnum(PaymentStatus)
    paymentStatus!: PaymentStatus

    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod
}
