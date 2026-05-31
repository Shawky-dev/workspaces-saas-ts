import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UserService as CommonUserService } from '../common/user/user.service'
import { UserService as TenantUserService } from '../tenant/user/user.service'

/**
 * Core JWT auth service for validating credentials and issuing access tokens.
 *
 * The service supports two distinct identity stores:
 * - `common` users, which live in the shared platform database.
 * - `tenant` users, which live in a tenant-specific workspace database.
 *
 * Each issued token includes a `type` claim so the matching Passport strategy
 * can reject tokens that belong to the wrong user domain.
 */
@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private commonUserService: CommonUserService,
        private tenantUserService: TenantUserService,
    ) { }

    /**
     * Validates credentials for a common user.
     *
     * @param email - The email address used to look up the user in the common database.
     * @param password - The plaintext password provided by the client.
     * @returns The authenticated common user document.
     * @throws {UnauthorizedException} When the user does not exist or the password is invalid.
     */
    async validateCommonUser(email: string, password: string) {
        const user = await this.commonUserService.findByEmail(email)
        if (!user) {
            throw new UnauthorizedException('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials')
        }

        return user
    }

    /**
     * Validates credentials for a tenant user.
     *
     * @param tenantId - The tenant/workspace identifier used to route the lookup.
     * @param email - The email address used to look up the user in that tenant database.
     * @param password - The plaintext password provided by the client.
     * @returns The authenticated tenant user document.
     * @throws {UnauthorizedException} When the user does not exist or the password is invalid.
     */
    async validateTenantUser(tenantId: string, email: string, password: string) {
        const user = await this.tenantUserService.findByEmail(tenantId, email)
        if (!user) {
            throw new UnauthorizedException('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials')
        }

        return user
    }

    /**
     * Issues a JWT for a common user after credentials have already been validated.
     *
     * The response intentionally returns only public profile fields so callers do
     * not receive the password hash or other internal persistence details.
     *
     * @param user - The validated common user document.
     * @returns The signed JWT and a public user payload.
     */
    async loginCommon(user: any) {
        const payload = { sub: user._id, email: user.email, type: 'common' }
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        }
    }

    /**
     * Issues a JWT for a tenant user after credentials have already been validated.
     *
     * The `tenantId` is embedded in the token so the tenant Passport strategy can
     * confirm the token belongs to the correct workspace.
     *
     * @param user - The validated tenant user document.
     * @param tenantId - The tenant/workspace identifier to embed in the token payload.
     * @returns The signed JWT and a public user payload.
     */
    async loginTenant(user: any, tenantId: string) {
        const payload = {
            sub: user._id,
            email: user.email,
            type: 'tenant',
            tenantId,
            role: user.role,
        }
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        }
    }
}
