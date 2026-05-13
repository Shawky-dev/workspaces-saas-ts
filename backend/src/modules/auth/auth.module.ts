import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtCommonStrategy } from './strategies/jwt-common.strategy'
import { JwtTenantStrategy } from './strategies/jwt-tenant.strategy'
import { CommonUserModule } from '../common/user/user.module'
import { TenantUserModule } from '../tenant/user/user.module'

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1h' },
            }),
            inject: [ConfigService],
        }),
        CommonUserModule,
        TenantUserModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtCommonStrategy, JwtTenantStrategy],
    exports: [AuthService],
})
export class AuthModule { }
