import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common'
import { TenantAuthGuard } from 'src/modules/auth/guards/tenant-auth.guard'
import { CloseSessionDto } from './dto/close-session.dto'
import { StartSessionDto } from './dto/start-session.dto'
import { UpdateSessionProductsDto } from './dto/update-session-products.dto'
import { SessionService } from './session.service'

@UseGuards(TenantAuthGuard)
@Controller(':tenantId')
export class SessionController {
    constructor(private readonly sessions: SessionService) { }

    @Get('sessions/active')
    async active(@Param('tenantId') tenantId: string) {
        return this.sessions.getActiveSessions(tenantId)
    }

    @Get('sessions/availability')
    async availability(@Param('tenantId') tenantId: string) {
        return this.sessions.getAvailability(tenantId)
    }

    @Post('sessions')
    async start(
        @Param('tenantId') tenantId: string,
        @Body() dto: StartSessionDto,
    ) {
        return this.sessions.startSession(tenantId, dto)
    }

    @Get('sessions/:id')
    async findOne(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.sessions.getSessionById(tenantId, id)
    }

    @Patch('sessions/:id/products')
    async updateProducts(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateSessionProductsDto,
    ) {
        return this.sessions.updateProducts(tenantId, id, dto)
    }

    @Post('sessions/:id/close')
    async close(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: CloseSessionDto,
    ) {
        return this.sessions.closeSession(tenantId, id, dto)
    }

    @Get('receipts')
    async receipts(@Param('tenantId') tenantId: string) {
        return this.sessions.getReceipts(tenantId)
    }

    @Get('receipts/:id')
    async receipt(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.sessions.getReceiptById(tenantId, id)
    }

    @Get('customers/:id/receipts')
    async customerReceipts(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.sessions.getCustomerReceipts(tenantId, id)
    }
}
