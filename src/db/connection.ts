import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { config } from "../config/env.js";

const adapter = new PrismaPg({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
});

export const prisma = new PrismaClient({ adapter });

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
