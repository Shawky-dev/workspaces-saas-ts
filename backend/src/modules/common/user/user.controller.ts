import {
    Body,
    Controller,
    Get,
    Post,
} from '@nestjs/common'

import { UserService } from './user.service'

import { CreateUserDto } from './dto/create-user'

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
    async create(
        @Body() dto: CreateUserDto,
    ) {
        return this.users.createUser(dto)
    }

    @Get()
    async findAll() {
        return this.users.findAllUsers()
    }
}
