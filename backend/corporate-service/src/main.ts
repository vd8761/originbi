import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const extraOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, mobile apps)
      if (!origin) return callback(null, true);

      // Allow *.originbi.com (any subdomain)
      if (/^https:\/\/([a-z0-9-]+\.)*originbi\.com$/.test(origin)) {
        return callback(null, true);
      }

      // Allow Vercel deployments
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Allow localhost for development
      if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Allow any extra origins from FRONTEND_URL env
      if (extraOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin in corporate-service: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
  });

  // Serve static email assets
  app.use('/email-assets', express.static(join(__dirname, 'mail', 'assets')));

  const port = process.env.PORT || 4003;
  await app.listen(port);
  console.log(`[corporate-service] running on http://localhost:${port}`);
}
void bootstrap();
