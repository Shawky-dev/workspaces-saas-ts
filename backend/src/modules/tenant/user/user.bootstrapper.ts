import { Injectable } from '@nestjs/common'

import { ITenantBootstrapper } from 'src/modules/common/tenants/bootstrap/bootstrap.interface'

import { TenantBootstrapPayload } from 'src/modules/common/tenants/bootstrap/bootstrap.interface'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user'

/**
 * Bootstrapper that seeds an initial admin user into a newly created tenant's database.
 *
 * Implements {@link ITenantBootstrapper} and is run automatically by `TenantBootstrapModule`
 * when a new tenant is created. It reads `payload.user.admin` and creates that user
 * in the tenant's database if they don't already exist.
 *
 * If no admin payload is provided, the bootstrapper exits silently — the tenant
 * is created without any users.
 */
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

/**
 * Shape of the user-related portion of the tenant bootstrap payload.
 */
export interface UserBootstrapPayload {
    /** The admin user to seed into the new tenant's database. */
    admin?: CreateUserDto
}
