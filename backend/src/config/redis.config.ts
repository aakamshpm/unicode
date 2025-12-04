import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password: string;
  ttl: number;
}

export const REDIS_CONFIG_KEY = 'redis';

export default registerAs(REDIS_CONFIG_KEY, (): RedisConfig => {
  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_TTL } = process.env;

  if (!REDIS_HOST) throw new Error('REDIS_HOST is not set');
  if (!REDIS_PASSWORD) throw new Error('REDIS_PASSWORD is not set');

  const port = Number(REDIS_PORT);
  if (Number.isNaN(port)) throw new Error('REDIS_PORT must be a number');

  const ttl = Number(REDIS_TTL);
  if (Number.isNaN(ttl)) throw new Error('REDIS_TTL must be a number');

  return {
    host: REDIS_HOST,
    port,
    password: REDIS_PASSWORD,
    ttl,
  };
});
