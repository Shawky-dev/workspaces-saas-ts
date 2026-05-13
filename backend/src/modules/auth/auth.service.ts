import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UserService as CommonUserService } from '../common/user/user.service'
import { UserService as TenantUserService } from '../tenant/user/user.service'

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private commonUserService: CommonUserService,
        private tenantUserService: TenantUserService,
    ) { }

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

    async loginTenant(user: any, tenantId: string) {
        const payload = {
            sub: user._id,
            email: user.email,
            type: 'tenant',
            tenantId
        }
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        }
    }
}
