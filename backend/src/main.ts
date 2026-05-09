import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { createAppModule } from './app.module'
import { ProductSeederService } from './modules/products/product-seeder.service'

async function main(): Promise<void> {
  const AppModule = createAppModule({
    commonUri: process.env.MONGO_COMMON_URI!,
    orgOneUri: process.env.MONGO_ORG1_URI!,
  })

  const app = await NestFactory.create(AppModule)

  await app.get(ProductSeederService).seed()

  await app.listen(3000)

  console.log('Server running at http://localhost:3000')
}

void main().catch(console.error)
