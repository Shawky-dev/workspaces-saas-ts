import { Module } from '@nestjs/common'
import {
    MongooseTenancyModule,
    fromRequest,
} from '@phen0menon/nestjs-mongoose-tenancy'

/**
 * Async factory that fetches all registered tenants from the common database.
 *
 * Called once at application bootstrap by `MongooseTenancyModule.forRoot`.
 * Maps each tenant document to the shape `{ id: slug, uri: mongoUri }`
 * that the tenancy library uses to build its connection registry.
 *
 * @param commonConnection - Active Mongoose connection to the shared
 *   "common" database, injected by the tenancy library.
 *
 * @returns Array of tenant descriptors understood by the tenancy engine.
 *
 * @example
 * // Returned structure:
 * [{ id: 'acme-corp', uri: 'mongodb://localhost/acme' }]
 */
const getTenants = async ({ commonConnection }) => {
    const docs = await commonConnection
        .collection('tenants')
        .find({})
        .toArray()

    console.log(docs)

    return docs.map(t => ({
        id: t.slug,
        uri: t.mongoUri,
    }))
}

/**
 * Configures the application's database-per-tenant isolation layer.
 *
 * This module wraps `MongooseTenancyModule.forRoot()` from
 * `@phen0menon/nestjs-mongoose-tenancy` and acts as the single source
 * of truth for tenant connection discovery and request-level resolution.
 *
 * ## Resolution Flow
 * 1. During application bootstrap, {@link getTenants} loads all tenant
 *    connection definitions from the shared MongoDB database.
 * 2. The tenancy library builds an internal connection registry using the
 *    returned `{ id, uri }` pairs.
 * 3. For every incoming HTTP request, `tenantResolver` extracts the
 *    `tenantId` route parameter and activates the matching tenant connection
 *    for the current request lifecycle.
 *
 * ## Usage
 * Import this module once inside `AppModule`.
 *
 * Feature modules can then register tenant-aware schemas using:
 *
 * ```ts
 * MongooseTenancyModule.forFeature([...])
 * ```
 *
 * @see getTenants
 */
@Module({
    imports: [
        MongooseTenancyModule.forRoot({
            /**
             * Shared/common MongoDB connection used to store
             * tenant metadata and bootstrap the registry.
             */
            common: {
                uri: process.env.MONGO_COMMON_URI!,
            },

            /**
             * Tenant registry factory executed during startup.
             */
            tenants: getTenants,

            /**
             * Resolves the active tenant ID from the incoming request.
             *
             * Expected route format:
             * `/api/:tenantId/...`
             */
            tenantResolver: fromRequest(
                (req: any) => req.params.tenantId,
            ),
        }),
    ],

    /**
     * Re-exported so feature modules can access tenancy-aware
     * Mongoose integration utilities.
     */
    exports: [MongooseTenancyModule],
})
export class TenancyModule { }
