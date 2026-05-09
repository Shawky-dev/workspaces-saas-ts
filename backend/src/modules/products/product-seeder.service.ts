import { Injectable } from '@nestjs/common'
import { Model } from 'mongoose'
import { COMMON_TENANT_ID, InjectTenantModelMap } from '@phen0menon/nestjs-mongoose-tenancy'
import type { ProductDocument } from './product.schema'
import { PRODUCT_MODEL_NAME } from './product.schema'

@Injectable()
export class ProductSeederService {
    constructor(
        @InjectTenantModelMap(PRODUCT_MODEL_NAME)
        private readonly productModels: ReadonlyMap<string, Model<ProductDocument>>,
    ) { }

    async seed(): Promise<void> {
        await Promise.all([
            this.seedTenant(COMMON_TENANT_ID, ['common-product']),
            this.seedTenant('org-1', ['tenant-product-a', 'tenant-product-b']),
        ])
    }

    private async seedTenant(tenantId: string, values: string[]): Promise<void> {
        const productModel = this.productModels.get(tenantId)

        if (!productModel) {
            throw new Error(`Product model is not registered for tenant "${tenantId}"`)
        }

        await productModel.deleteMany({})
        await productModel.create(values.map((value) => ({ value })))
    }
}
