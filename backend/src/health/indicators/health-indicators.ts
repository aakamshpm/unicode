import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult } from '@nestjs/terminus';
import * as amqp from 'amqplib';
import Redis from 'ioredis';
import { RABBITMQ_CONFIG_KEY } from 'src/config/rabbitmq.config';
import { REDIS_CONFIG_KEY } from 'src/config/redis.config';

@Injectable()
export class RedisHealthIndicator {
  constructor(private readonly configService: ConfigService) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const redisConfig = this.configService.get(REDIS_CONFIG_KEY);

    const client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      connectTimeout: 5000,
      lazyConnect: true,
    });

    try {
      await client.connect();
      await client.ping();
      await client.quit();
      return { [key]: { status: 'up' } };
    } catch (error) {
      await client.quit().catch(() => {});
      return {
        [key]: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

@Injectable()
export class RabbitMQHealthIndicator {
  constructor(private configService: ConfigService) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const rabbitmqConfig = this.configService.get(RABBITMQ_CONFIG_KEY);

    try {
      const connection = await amqp.connect(rabbitmqConfig.url);
      await connection.close();
      return { [key]: { status: 'up' } };
    } catch (error) {
      return {
        [key]: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
