import { Controller, Post, Body, Param } from '@nestjs/common'
import { AuthService } from './auth.service'
import { CommonLoginDto } from './dto/common-login.dto'
import { TenantLoginDto } from './dto/tenant-login.dto'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('common/login')
    async commonLogin(@Body() commonLoginDto: CommonLoginDto) {
        const user = await this.authService.validateCommonUser(
            commonLoginDto.email,
            commonLoginDto.password,
        )
        return this.authService.loginCommon(user)
    }

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
