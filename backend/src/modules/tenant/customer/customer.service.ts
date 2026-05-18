import {
    Injectable,
    Inject,
    NotFoundException,
} from '@nestjs/common'

import {
    TENANT_MODEL_REGISTRY,
} from '@phen0menon/nestjs-mongoose-tenancy'

import type {
    TenantModelRegistry,
} from '@phen0menon/nestjs-mongoose-tenancy'

import { TenantRepository } from 'src/public/db/tenant.repository'

import {
    CUSTOMER_MODEL_NAME,
} from './customer.schema'

import type {
    CustomerDocument,
} from './customer.schema'

import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'

@Injectable()
export class CustomerService extends TenantRepository<CustomerDocument> {
    constructor(
        @Inject(TENANT_MODEL_REGISTRY)
        modelRegistry: TenantModelRegistry,
    ) {
        super(modelRegistry, CUSTOMER_MODEL_NAME)
    }

    async createCustomer(
        tenantId: string,
        data: CreateCustomerDto,
    ) {
        return this.createDocument(data, tenantId)
    }

    async findAllCustomers(tenantId: string) {
        return this.modelFor(tenantId)
            .find()
            .lean()
    }

    async findCustomerById(
        tenantId: string,
        id: string,
    ) {
        const customer = await this.modelFor(tenantId)
            .findById(id)

        if (!customer) {
            throw new NotFoundException(
                'Customer not found',
            )
        }

        return customer
    }

    async updateCustomer(
        tenantId: string,
        id: string,
        data: UpdateCustomerDto,
    ) {
        return this.modelFor(tenantId)
            .findByIdAndUpdate(
                id,
                data,
                { new: true },
            )
    }

    async deleteCustomer(
        tenantId: string,
        id: string,
    ) {
        return this.modelFor(tenantId)
            .findByIdAndDelete(id)
    }
}