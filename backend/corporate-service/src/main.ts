import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    app.enableCors({
        origin: true,
        credentials: true,
    });

    const port = process.env.PORT || 4003;
    await app.listen(port);
    console.log(`[corporate-service] running on http://localhost:${port}`);
}
bootstrap();
