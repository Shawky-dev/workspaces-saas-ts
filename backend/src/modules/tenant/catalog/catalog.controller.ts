import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Res,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { TenantAuthGuard } from 'src/modules/auth/guards/tenant-auth.guard'
import { CatalogService } from './catalog.service'
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto'
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
])

const catalogImageInterceptor = FileInterceptor('image', {
    limits: {
        fileSize: MAX_IMAGE_SIZE,
    },
    fileFilter: (_request, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            callback(
                new BadRequestException(
                    'Image must be a jpeg, png, webp, or gif file',
                ),
                false,
            )
            return
        }

        callback(null, true)
    },
})

@UseGuards(TenantAuthGuard)
@Controller(':tenantId/catalog/items')
export class CatalogController {
    constructor(private readonly catalog: CatalogService) { }

    @Post()
    @UseInterceptors(catalogImageInterceptor)
    async create(
        @Param('tenantId') tenantId: string,
        @Body() dto: CreateCatalogItemDto,
        @UploadedFile() image?: any,
    ) {
        return this.catalog.createItem(tenantId, dto, image)
    }

    @Get()
    async findAll(
        @Param('tenantId') tenantId: string,
    ) {
        return this.catalog.findAllItems(tenantId)
    }

    @Get(':id/image')
    async findImage(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        const image = await this.catalog.findImageById(tenantId, id)

        response.set({
            'Content-Type': image.contentType,
            'Content-Length': image.data.length,
            'Content-Disposition': `inline; filename="${image.originalName}"`,
        })

        return new StreamableFile(image.data)
    }

    @Get(':id')
    async findOne(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.catalog.findPublicById(tenantId, id)
    }

    @Patch(':id')
    @UseInterceptors(catalogImageInterceptor)
    async update(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateCatalogItemDto,
        @UploadedFile() image?: any,
    ) {
        return this.catalog.updateItem(tenantId, id, dto, image)
    }

    @Delete(':id')
    async remove(
        @Param('tenantId') tenantId: string,
        @Param('id') id: string,
    ) {
        return this.catalog.deleteItem(tenantId, id)
    }
}
