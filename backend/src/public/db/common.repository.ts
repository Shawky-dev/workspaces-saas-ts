import { Model } from "mongoose"
import { BaseRepository } from "./base.repository"
/**
 * Repository base class for collections stored in the **shared common database**.
 *
 * Extends {@link BaseRepository} with a fixed Mongoose `Model` injected at
 * construction time. Use this as the base for any service that reads/writes
 * platform-level data (e.g. tenants, common users) that is not scoped to a
 * specific workspace.
 *
 * @typeParam T - The Mongoose document type this repository operates on.
 *
 * @example
 * ```ts
 * @Injectable()
 * export class UserService extends CommonRepository<UserDocument> {
 *   constructor(@InjectModel(USER_MODEL_NAME) model: Model<UserDocument>) {
 *     super(model)
 *   }
 * }
 * ```
 */
export abstract class CommonRepository<T> extends BaseRepository<T> {
    constructor(private readonly model: Model<T>) {
        super()
    }

    protected modelFor(): Model<T> {
        return this.model
    }
}
