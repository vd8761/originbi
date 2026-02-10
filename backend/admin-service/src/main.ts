import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const allowedOrigins = [
    'https://mind.originbi.com',
    'https://originbi.vercel.app',
    'http://localhost:3000',
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
      'X-User-Context',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'content-type',
      'authorization',
      'x-user-context',
    ],
  });

  const port = process.env.PORT || 4001;
  await app.listen(port);
}
void bootstrap();
