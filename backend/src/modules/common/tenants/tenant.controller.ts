import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from '@nestjs/common'

import { TenantService } from './tenant.service'
import { CreateTenantDto } from './dto/create-tenant'

@Controller('tenants')
export class TenantController {
    constructor(
        private readonly tenantService: TenantService,
    ) { }

    @Post()
    async create(
        @Body() createTenantDto: CreateTenantDto,
    ) {
        return this.tenantService.createTenant(
            createTenantDto,
        )
    }

    @Get()
    async findAll() {
        return this.tenantService.getAllTenants()
    }

    @Get(':slug')
    async findBySlug(
        @Param('slug') slug: string,
    ) {
        return this.tenantService.getTenantBySlug(
            slug,
        )
    }
}
