import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Passport guard for endpoints that require a valid common-user JWT.
 */
@Injectable()
export class CommonAuthGuard extends AuthGuard('jwt-common') { }
