import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import databaseConfig from './database.config';
import redisConfig from './redis.config';
import rabbitmqConfig from './rabbitmq.config';
import oauthConfig from './oauth.config';
import { envValidationSchema } from './env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [databaseConfig, redisConfig, rabbitmqConfig, oauthConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
  ],
})
export class ConfigModule {}
