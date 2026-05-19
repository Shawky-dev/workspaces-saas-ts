import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common'

import { UserService } from './user.service'

import { CreateUserDto } from './dto/create-user'
import { UpdateUserDto } from './dto/update-user'
import { UseGuards } from '@nestjs/common'
import { CommonAuthGuard } from '../../auth/guards/common-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { Role } from '../../auth/enums/role.enum'

/**
 * REST controller for platform-level user management.
 *
 * Base route: `POST /common/users`, `GET /common/users`
 *
 * These endpoints operate on the shared common database and are not
 * scoped to any tenant. Intended for platform administration use cases
 * (e.g. registering the first admin before any workspace exists).
 */
@Controller('common/users')
export class UserController {
    constructor(
        private readonly users: UserService,
    ) { }

    @Post()
    @Roles(Role.SUPER_ADMIN)
    async create(
        @Body() dto: CreateUserDto,
    ) {
        return this.users.createUser(dto)
    }

    @Get()
    @Roles(Role.SUPER_ADMIN)
    async findAll() {
        return this.users.findAllUsers()
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN)
    async findOne(
        @Param('id') id: string,
    ) {
        return this.users.findPublicById(id)
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN)
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
    ) {
        return this.users.updateUser(id, dto)
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN)
    async remove(
        @Param('id') id: string,
    ) {
        return this.users.deleteUser(id)
    }
}
