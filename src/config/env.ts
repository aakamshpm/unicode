import dotenv from "dotenv";

dotenv.config();

const { PORT, DATABASE_URL, NODE_ENV, REDIS_HOST, REDIS_PORT } = process.env;

if (!PORT) throw new Error("Missing env: PORT");
if (!DATABASE_URL) throw new Error("Missing env: DATABASE_URL");
if (!NODE_ENV) throw new Error("Missing env: NODE_ENV");
if (!REDIS_HOST) throw new Error("Missing env: REDIS_HOST");
if (!REDIS_PORT) throw new Error("Missing env: REDIS_PORT");

export const config = {
  PORT: Number(PORT),
  DATABASE_URL,
  NODE_ENV,
  REDIS_HOST,
  REDIS_PORT: Number(REDIS_PORT),
};
