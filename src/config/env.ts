import dotenv from "dotenv";
dotenv.config();

const {
  PORT,
  DB_HOST,
  DB_PORT,
  DB_PASSWORD,
  DB_NAME,
  DB_USER,
  NODE_ENV,
  REDIS_HOST,
  REDIS_PORT,
} = process.env;

if (!PORT) throw new Error("Missing env: PORT");
if (!DB_HOST) throw new Error("Missing env: DB_HOST");
if (!DB_PORT) throw new Error("Missing env: DB_PORT");
if (!DB_USER) throw new Error("Missing env: DB_USER");
if (!DB_PASSWORD) throw new Error("Missing env: DB_PASSWORD");
if (!DB_NAME) throw new Error("Missing env: DB_NAME");
if (!NODE_ENV) throw new Error("Missing env: NODE_ENV");
if (!REDIS_HOST) throw new Error("Missing env: REDIS_HOST");
if (!REDIS_PORT) throw new Error("Missing env: REDIS_PORT");

export const config = {
  PORT: Number(PORT),
  DB_HOST,
  DB_PORT: Number(DB_PORT),
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  NODE_ENV,
  REDIS_HOST,
  REDIS_PORT: Number(REDIS_PORT),
};
