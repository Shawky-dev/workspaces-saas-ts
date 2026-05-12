import { Model } from "mongoose"
import { BaseRepository } from "./base.repository"

export abstract class CommonRepository<T> extends BaseRepository<T> {
    constructor(private readonly model: Model<T>) {
        super()
    }

    protected modelFor(): Model<T> {
        return this.model
    }
}
