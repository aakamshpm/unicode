import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const PORT = Number(process.env.PORT);
const NODE_ENV = process.env.NODE_ENV;

if (!process.env.PORT || isNaN(Number(process.env.PORT))) {
  throw new Error("PORT is required and must be a number");
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const config = {
  DATABASE_URL,
  PORT,
  NODE_ENV,
} as const;
