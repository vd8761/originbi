// backend/auth-service/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  await app.listen(4002); // IMPORTANT: this port must match admin-service .env
  console.log('Auth-service running on http://localhost:4002');
}
bootstrap();
