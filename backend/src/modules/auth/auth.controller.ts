import { Controller, Post, Body, Param } from '@nestjs/common'
import { AuthService } from './auth.service'
import { CommonLoginDto } from './dto/common-login.dto'
import { TenantLoginDto } from './dto/tenant-login.dto'

/**
 * Authentication endpoints for both platform-level users and tenant-scoped users.
 *
 * This controller exposes the two login entry points used by the JWT auth flow:
 * - `POST /auth/common/login` for users stored in the shared common database.
 * - `POST /auth/:tenantId/login` for users stored inside a specific tenant database.
 */
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * Authenticates a common user and returns a JWT access token plus a public user payload.
     *
     * The credentials are validated against the shared common user collection.
     *
     * @param commonLoginDto - Email and password submitted by the client.
     * @returns A signed access token and the public user fields used by the frontend.
     */
    @Post('common/login')
    async commonLogin(@Body() commonLoginDto: CommonLoginDto) {
        const user = await this.authService.validateCommonUser(
            commonLoginDto.email,
            commonLoginDto.password,
        )
        return this.authService.loginCommon(user)
    }

    /**
     * Authenticates a tenant user and returns a JWT access token plus a public user payload.
     *
     * The tenant identifier comes from the route parameter so the lookup is performed
     * against the correct workspace database.
     *
     * @param tenantId - The tenant/workspace identifier from the route.
     * @param tenantLoginDto - Email and password submitted by the client.
     * @returns A signed access token and the public user fields used by the frontend.
     */
    @Post(':tenantId/login')
    async tenantLogin(
        @Param('tenantId') tenantId: string,
        @Body() tenantLoginDto: TenantLoginDto,
    ) {
        const user = await this.authService.validateTenantUser(
            tenantId,
            tenantLoginDto.email,
            tenantLoginDto.password,
        )
        return this.authService.loginTenant(user, tenantId)
    }
}
