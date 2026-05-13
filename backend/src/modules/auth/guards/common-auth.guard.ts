import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class CommonAuthGuard extends AuthGuard('jwt-common') { }
