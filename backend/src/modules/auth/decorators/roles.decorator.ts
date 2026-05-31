import { SetMetadata } from '@nestjs/common'
import { TenantUserRole } from '../../tenant/user/role.enum'

export const ROLES_KEY = 'roles'

export const Roles = (...roles: TenantUserRole[]) =>
    SetMetadata(ROLES_KEY, roles)
