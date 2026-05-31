import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { TenantAuthGuard } from 'src/modules/auth/guards/tenant-auth.guard'
import { RolesGuard } from 'src/modules/auth/guards/roles.guard'
import { Roles } from 'src/modules/auth/decorators/roles.decorator'
import { TenantUserRole } from './role.enum'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user'
import { UpdateUserDto } from './dto/update-user'

/**
 * REST controller for tenant-scoped user management.
 *
 * Base route: `POST /:tenantId/users`, `GET /:tenantId/users`
 *
 * The `:tenantId` path parameter is used by `TenancyModule` to resolve the
 * correct workspace database connection for every request.
 */
@UseGuards(TenantAuthGuard, RolesGuard)
@Controller(':tenantId/users')
export class UserController {
    constructor(private readonly users: UserService) { }

    @Post()
    @Roles(TenantUserRole.SUPER_ADMIN)
    async create(
        @Param('tenantId') tenantId: string,
        @Body() dto: CreateUserDto,
    ) {
        return this.users.createUser(tenantId, dto)
    }

    @Get()
    async findAll(
        @Param('tenantId') tenantId: string,
    ) {
        return this.users.findAllUsers(tenantId)
    }

    @Get(':id')
    async findOne(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.users.findPublicById(tenantId, id)
    }

    @Patch(':id')
    @Roles(TenantUserRole.SUPER_ADMIN)
    async update(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
    ) {
        return this.users.updateUser(tenantId, id, dto)
    }

    @Delete(':id')
    @Roles(TenantUserRole.SUPER_ADMIN)
    async remove(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.users.deleteUser(tenantId, id)
    }
}
