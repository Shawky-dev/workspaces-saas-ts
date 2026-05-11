
import { ConflictException } from '@nestjs/common'

export class ResourceAlreadyExistsException extends ConflictException {
    constructor(resource: string, field: string) {
        super(`${resource} with this ${field} already exists`)
    }
}
