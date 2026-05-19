import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user'
import { UpdateUserDto } from './dto/update-user'
import { TenantAuthGuard } from '../../auth/guards/tenant-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { Role } from '../../auth/enums/role.enum'
/**
 * REST controller for tenant-scoped user management.
 *
 * Base route: `POST /:tenantId/users`, `GET /:tenantId/users`
 *
 * The `:tenantId` path parameter is used by `TenancyModule` to resolve the
 * correct workspace database connection for every request.
 */
@Controller(':tenantId/users')
export class UserController {
    constructor(private readonly users: UserService) { }

    @Post()
    @Roles(Role.TENANT_ADMIN)
    async create(
        @Param('tenantId') tenantId: string,
        @Body() dto: CreateUserDto,
    ) {
        return this.users.createUser(tenantId, dto)
    }

    @Get()
    @Roles(Role.TENANT_ADMIN)
    async findAll(
        @Param('tenantId') tenantId: string,
    ) {
        return this.users.findAllUsers(tenantId)
    }

    @Get(':id')
    @Roles(Role.TENANT_ADMIN)
    async findOne(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.users.findPublicById(tenantId, id)
    }

    @Patch(':id')
    @Roles(Role.TENANT_ADMIN)
    async update(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
    ) {
        return this.users.updateUser(tenantId, id, dto)
    }

    @Delete(':id')
    @Roles(Role.TENANT_ADMIN)
    async remove(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.users.deleteUser(tenantId, id)
    }

}
