import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const allowedOrigins = [
    'https://mind.originbi.com',
    'https://originbi.vercel.app',
    ...(process.env.FRONTEND_URL || '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean),
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'content-type',
      'authorization',
    ],
  });

  const port = process.env.PORT || 4001;
  await app.listen(port);
}
void bootstrap();
