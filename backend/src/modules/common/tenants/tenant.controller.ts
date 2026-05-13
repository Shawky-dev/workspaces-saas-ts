import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common'

import { TenantService } from './tenant.service'
import { CreateTenantDto } from './dto/create-tenant'
import { UpdateTenantDto } from './dto/update-tenant'

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

    @Patch(':slug')
    async update(
        @Param('slug') slug: string,
        @Body() dto: UpdateTenantDto,
    ) {
        return this.tenantService.updateTenant(slug, dto)
    }

    @Delete(':slug')
    async remove(
        @Param('slug') slug: string,
    ) {
        return this.tenantService.deleteTenant(slug)
    }
}
