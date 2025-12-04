import { registerAs } from '@nestjs/config';

export interface RabbitMQConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  queueName: string;
  url: string;
}

export const RABBITMQ_CONFIG_KEY = 'rabbitmq';

export default registerAs(RABBITMQ_CONFIG_KEY, (): RabbitMQConfig => {
  const {
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USER,
    RABBITMQ_PASSWORD,
    RABBITMQ_QUEUE_NAME,
  } = process.env;

  if (!RABBITMQ_HOST) throw new Error('RABBITMQ_HOST is not set');
  if (!RABBITMQ_PORT) throw new Error('RABBITMQ_PORT is not set');
  if (!RABBITMQ_USER) throw new Error('RABBITMQ_USER is not set');
  if (!RABBITMQ_PASSWORD) throw new Error('RABBITMQ_PASSWORD is not set');
  if (!RABBITMQ_QUEUE_NAME) throw new Error('RABBITMQ_QUEUE_NAME is not set');

  const port = Number(RABBITMQ_PORT);
  if (Number.isNaN(port))
    throw new Error('RABBITMQ_PORT must be a valid number');

  const url = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${port}`;

  return {
    host: RABBITMQ_HOST,
    port,
    user: RABBITMQ_USER,
    password: RABBITMQ_PASSWORD,
    queueName: RABBITMQ_QUEUE_NAME,
    url,
  };
});
