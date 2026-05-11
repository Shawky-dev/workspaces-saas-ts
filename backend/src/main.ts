import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { setupValidation } from './common/config/validation.config'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  setupValidation(app)

  await app.listen(3000)

  console.log('Server running at http://localhost:3000')
}

void bootstrap()
