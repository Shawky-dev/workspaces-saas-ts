import {
    BadRequestException,
    Injectable,
    Inject,
    NotFoundException,
} from '@nestjs/common'
import { TENANT_MODEL_REGISTRY } from '@phen0menon/nestjs-mongoose-tenancy'
import type { TenantModelRegistry } from '@phen0menon/nestjs-mongoose-tenancy'
import { TenantRepository } from 'src/public/db/tenant.repository'
import {
    CATALOG_ITEM_MODEL_NAME,
    CatalogItemDocument,
} from './catalog-item.schema'
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto'
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto'
import { BulkUpdateQuantitiesDto } from './dto/bulk-update-quantities.dto'
import { AdjustQuantityDto } from './dto/adjust-quantity.dto'

type UploadedCatalogImage = {
    buffer: Buffer
    mimetype: string
    originalname: string
    size: number
}

@Injectable()
export class CatalogService extends TenantRepository<CatalogItemDocument> {
    constructor(
        @Inject(TENANT_MODEL_REGISTRY)
        modelRegistry: TenantModelRegistry,
    ) {
        super(modelRegistry, CATALOG_ITEM_MODEL_NAME)
    }

    async createItem(
        tenantId: string,
        data: CreateCatalogItemDto,
        image?: UploadedCatalogImage,
    ) {
        const item = await this.createDocument(
            {
                ...data,
                description: data.description ?? '',
                ...this.toImageFields(image),
            },
            tenantId,
        )

        return this.toPublicItem(tenantId, item)
    }

    async findAllItems(tenantId: string) {
        const items = await this.modelFor(tenantId)
            .find()
            .select('-imageData')
            .lean()

        return items.map((item) => this.toPublicItem(tenantId, item))
    }

    async findPublicById(tenantId: string, id: string) {
        const item = await this.modelFor(tenantId)
            .findById(id)
            .select('-imageData')
            .lean()

        if (!item) {
            throw new NotFoundException('CatalogItem not found')
        }

        return this.toPublicItem(tenantId, item)
    }

    async updateItem(
        tenantId: string,
        id: string,
        data: UpdateCatalogItemDto,
        image?: UploadedCatalogImage,
    ) {
        const model = this.modelFor(tenantId)
        const item = await model.findById(id)

        if (!item) {
            throw new NotFoundException('CatalogItem not found')
        }

        item.set({
            ...data,
            ...this.toImageFields(image),
        })

        const savedItem = await item.save()
        return this.toPublicItem(tenantId, savedItem)
    }

    async deleteItem(tenantId: string, id: string) {
        const item = await this.modelFor(tenantId)
            .findByIdAndDelete(id)
            .select('-imageData')
            .lean()

        if (!item) {
            throw new NotFoundException('CatalogItem not found')
        }

        return this.toPublicItem(tenantId, item)
    }

    async bulkUpdateQuantities(
        tenantId: string,
        data: BulkUpdateQuantitiesDto,
    ) {
        const ids = data.items.map((item) => item.id)
        const uniqueIds = new Set(ids)

        if (uniqueIds.size !== ids.length) {
            throw new BadRequestException('Duplicate catalog item ids are not allowed')
        }

        const model = this.modelFor(tenantId)
        const existingItems = await model
            .find({ _id: { $in: ids } })
            .select('_id')
            .lean()

        if (existingItems.length !== ids.length) {
            throw new NotFoundException('One or more catalog items were not found')
        }

        await model.bulkWrite(
            data.items.map((item) => ({
                updateOne: {
                    filter: { _id: item.id },
                    update: {
                        $set: {
                            quantityOnHand: item.quantityOnHand,
                        },
                    },
                },
            })),
        )

        const updatedItems = await model
            .find({ _id: { $in: ids } })
            .select('-imageData')
            .lean()
        const updatedById = new Map(
            updatedItems.map((item: any) => [item._id.toString(), item]),
        )

        return ids.map((id) => this.toPublicItem(tenantId, updatedById.get(id)))
    }

    async adjustQuantity(
        tenantId: string,
        id: string,
        data: AdjustQuantityDto,
    ) {
        const model = this.modelFor(tenantId)
        const item = await model.findById(id)

        if (!item) {
            throw new NotFoundException('CatalogItem not found')
        }

        const nextQuantity = (item.quantityOnHand ?? 0) + data.delta

        if (nextQuantity < 0) {
            throw new BadRequestException('Quantity cannot be less than zero')
        }

        item.quantityOnHand = nextQuantity
        const savedItem = await item.save()

        return this.toPublicItem(tenantId, savedItem)
    }

    async findImageById(tenantId: string, id: string) {
        const item = await this.modelFor(tenantId).findById(id)

        if (!item || !item.imageData || !item.imageContentType) {
            throw new NotFoundException('Catalog item image not found')
        }
        const data = this.toBuffer(item.imageData)

        return {
            data,
            contentType: item.imageContentType,
            originalName: item.imageOriginalName ?? 'catalog-item-image',
            size: item.imageSize,
        }
    }

    private toBuffer(data: any) {
        if (Buffer.isBuffer(data)) {
            return Buffer.from(data)
        }

        if (data?.buffer && Buffer.isBuffer(data.buffer)) {
            return Buffer.from(data.buffer)
        }

        if (data?.buffer) {
            return Buffer.from(data.buffer)
        }

        return Buffer.from(data)
    }

    private toImageFields(image?: UploadedCatalogImage) {
        if (!image) {
            return {}
        }

        return {
            imageData: image.buffer,
            imageContentType: image.mimetype,
            imageOriginalName: image.originalname,
            imageSize: image.size,
        }
    }

    private toPublicItem(tenantId: string, item: any) {
        const id = item._id?.toString?.() ?? item.id
        const hasImage = Boolean(item.imageContentType)

        return {
            id,
            name: item.name,
            purchasePrice: item.purchasePrice,
            soldPrice: item.soldPrice,
            description: item.description,
            quantityOnHand: item.quantityOnHand ?? 0,
            image: hasImage
                ? {
                    contentType: item.imageContentType,
                    originalName: item.imageOriginalName,
                    size: item.imageSize,
                }
                : null,
            hasImage,
            imageUrl: hasImage
                ? `/${tenantId}/catalog/items/${id}/image`
                : null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }
    }
}
