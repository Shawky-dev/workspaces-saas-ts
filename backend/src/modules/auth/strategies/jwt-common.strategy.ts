import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../common/user/user.service'

/**
 * Passport JWT strategy for authenticating platform-level users.
 *
 * This strategy only accepts tokens with `type: 'common'` and resolves the
 * user from the shared common database using the `sub` claim.
 */
@Injectable()
export class JwtCommonStrategy extends PassportStrategy(Strategy, 'jwt-common') {
    constructor(
        private userService: UserService,
        private configService: ConfigService,
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
     * Validates the JWT payload against the common user collection.
     *
     * @param payload - Decoded JWT payload produced by `JwtService.sign`.
     * @returns The sanitized user object attached to `request.user`.
     * @throws {UnauthorizedException} When the token type is wrong or the user cannot be found.
     */
    async validate(payload: any) {
        if (payload.type !== 'common') {
            throw new UnauthorizedException('Invalid token type')
        }

        const user = await this.userService.findById(payload.sub)
        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        return {
            id: user._id,
            email: user.email,
            name: user.name,
        }
    }
}
