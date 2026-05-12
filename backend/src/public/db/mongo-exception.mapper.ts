import { MongoServerError } from 'mongodb'
import { ResourceAlreadyExistsException } from '../exceptions/conflict.exception'

export class MongoExceptionMapper {
    static map(error: unknown): never {
        if (
            error instanceof MongoServerError &&
            error.code === 11000
        ) {
            const field = Object.keys(error.keyPattern ?? {})[0]

            throw new ResourceAlreadyExistsException(
                'Resource',
                field,
            )
        }

        throw error
    }
}
