import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import {
  RabbitMQHealthIndicator,
  RedisHealthIndicator,
} from './indicators/health-indicators';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, RabbitMQHealthIndicator],
})
export class HealthModule {}
