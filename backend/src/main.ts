import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? '' : '*',
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
