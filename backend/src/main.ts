import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.use(cookieParser());

  // Global API prefix - all routes will be prefixed with /api
  // Exception: /health endpoint
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin:
      configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
  });

  const port = configService.get<number>('PORT');

  if (!port || Number.isNaN(port) || port < 1) {
    throw new Error(`Invalid PORT: ${port}. Must be a valid TCP PORT`);
  }
  await app.listen(port);

  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();
