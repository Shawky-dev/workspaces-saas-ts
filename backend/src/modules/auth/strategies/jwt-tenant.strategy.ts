import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../tenant/user/user.service'

/**
 * Passport JWT strategy for authenticating tenant-scoped users.
 *
 * This strategy only accepts tokens with `type: 'tenant'` and uses both the
 * tenant id and email claims to resolve the current workspace user.
 */
@Injectable()
export class JwtTenantStrategy extends PassportStrategy(Strategy, 'jwt-tenant') {
    constructor(private userService: UserService, private configService: ConfigService,
    ) {
        const secret = configService.get<string>('JWT_SECRET')

        if (!secret) {
            throw new Error('JWT_SECRET is not defined')
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        })
    }

    /**
     * Validates the JWT payload against the tenant user collection.
     *
     * @param payload - Decoded JWT payload produced by `JwtService.sign`.
     * @returns The sanitized user object attached to `request.user`.
     * @throws {UnauthorizedException} When the token type is wrong or the user cannot be found.
     */
    async validate(payload: any) {
        if (payload.type !== 'tenant') {
            throw new UnauthorizedException('Invalid token type')
        }

        const user = await this.userService.findByEmail(payload.tenantId, payload.email)
        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        return {
            id: user._id,
            email: user.email,
            name: user.name,
            tenantId: payload.tenantId,
            role: user.role,
        }
    }
}
