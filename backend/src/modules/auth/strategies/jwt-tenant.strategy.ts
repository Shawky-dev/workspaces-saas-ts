import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../tenant/user/user.service'

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
        }
    }
}
