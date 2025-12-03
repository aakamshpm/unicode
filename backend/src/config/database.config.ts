import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const {
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME,
    DATABASE_SYNCHRONIZE,
    DATABASE_LOGGING,
  } = process.env;

  if (!DATABASE_HOST) throw new Error('DATABASE_HOST is not set');
  if (!DATABASE_PORT) throw new Error('DATABASE_PORT is not set');

  const port = Number(DATABASE_PORT);
  if (Number.isNaN(port)) throw new Error('DATABASE_PORT must be a number');

  return {
    type: 'postgres',
    host: DATABASE_HOST,
    port,
    username: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: DATABASE_SYNCHRONIZE === 'true',
    logging: DATABASE_LOGGING === 'true',
    autoLoadEntities: true,
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: false,
  };
});
