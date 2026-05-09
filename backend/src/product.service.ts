import { Injectable } from '@nestjs/common'
import { InjectTenantModel } from '@phen0menon/nestjs-mongoose-tenancy'
import { Model } from 'mongoose'
import { PRODUCT_MODEL_NAME, ProductDocument } from './product.schema'

@Injectable()
export class ProductService {
    constructor(
        @InjectTenantModel(PRODUCT_MODEL_NAME)
        private readonly products: Model<ProductDocument>,
    ) { }

    async list(): Promise<ProductDocument[]> {
        return this.products.find().lean()
    }

    async values(): Promise<string[]> {
        const products = await this.products.find().lean()
        const vals = products.map(p => p.value).filter((v): v is string => typeof v === 'string')
        return vals
    }
}
