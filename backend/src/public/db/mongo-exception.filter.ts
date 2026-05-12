import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common'
import { HttpStatus } from '@nestjs/common'
import { MongoServerError } from 'mongodb'
import { MONGO_ERROR_CODES } from '../constants/mongo-error-codes.constant'

@Catch(MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
    catch(exception: MongoServerError, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse()

        if (exception.code === MONGO_ERROR_CODES.DUPLICATE_KEY) {
            const field = Object.keys(exception.keyPattern ?? {})[0]
            response.status(409).json({
                statusCode: 409,
                error: 'Conflict',
                message: `${field} already exists`,
            })
            return
        }

        response.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: 'Internal server error',
        })
    }
}
