import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user'

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
}
