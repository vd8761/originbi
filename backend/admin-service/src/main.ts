import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const allowedOrigins = [
    'http://localhost:3000',
    'https://originbi.vercel.app',
    process.env.FRONTEND_URL, // optional extra
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins as string[],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
}
void bootstrap();
