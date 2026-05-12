import { Injectable } from '@nestjs/common'

import { ITenantBootstrapper } from 'src/modules/common/tenants/bootstrap/bootstrap.interface'

import { TenantBootstrapPayload } from 'src/modules/common/tenants/bootstrap/bootstrap.interface'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user'

@Injectable()
export class TenantUserBootstrapper
    implements ITenantBootstrapper {

    constructor(
        private readonly userService: UserService,
    ) { }

    async run(
        tenantId: string,
        payload?: TenantBootstrapPayload,
    ): Promise<void> {

        const admin = payload?.user?.admin

        if (!admin) {
            return
        }

        const existingUser =
            await this.userService.findByEmail(
                tenantId,
                admin.email,
            )

        if (existingUser) {
            return
        }

        await this.userService.createUser(
            tenantId,
            admin,
        )
    }
}

export interface UserBootstrapPayload {
    admin?: CreateUserDto
}
