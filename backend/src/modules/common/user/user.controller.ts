import {
    Body,
    Controller,
    Get,
    Post,
} from '@nestjs/common'

import { UserService } from './user.service'

import { CreateUserDto } from './dto/create-user'

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
