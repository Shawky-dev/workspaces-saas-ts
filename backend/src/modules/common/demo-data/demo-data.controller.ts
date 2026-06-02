import { Controller, Post, UseGuards } from '@nestjs/common'
import { CommonAuthGuard } from 'src/modules/auth/guards/common-auth.guard'
import { DemoDataService } from './demo-data.service'

@Controller('demo')
export class DemoDataController {
    constructor(private readonly demoData: DemoDataService) { }

    @UseGuards(CommonAuthGuard)
    @Post('load')
    async load() {
        return this.demoData.load()
    }
}
