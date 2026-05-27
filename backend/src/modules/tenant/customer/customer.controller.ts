import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common'

import { CustomerService } from './customer.service'

import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { TenantAuthGuard } from 'src/modules/auth/guards/tenant-auth.guard'


@UseGuards(TenantAuthGuard)
@Controller(':tenantId/customers')
export class CustomerController {
    constructor(
        private readonly customerService: CustomerService,
    ) {}

    @Post()
    async create(
        @Param('tenantId') tenantId: string,
        @Body() dto: CreateCustomerDto,
    ) {
        return this.customerService.createCustomer(
            tenantId,
            dto,
        )
    }

    @Get()
    async findAll(
        @Param('tenantId') tenantId: string,
    ) {
        return this.customerService.findAllCustomers(
            tenantId,
        )
    }

    @Get(':id')
    async findOne(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.customerService.findCustomerById(
            tenantId,
            id,
        )
    }

    @Patch(':id')
    async update(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateCustomerDto,
    ) {
        return this.customerService.updateCustomer(
            tenantId,
            id,
            dto,
        )
    }

    @Delete(':id')
    async remove(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.customerService.deleteCustomer(
            tenantId,
            id,
        )
    }
}