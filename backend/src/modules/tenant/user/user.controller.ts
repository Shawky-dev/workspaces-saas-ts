import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user'

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
