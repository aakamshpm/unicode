import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

const connection = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  maxRetriesPerRequest: null,
});

connection.on("connect", () => logger.info("Redis connected"));
connection.on("error", (err) => logger.error({ err }, "Redis connection error"));

export const submissionQueue = new Queue("submission-queue", { connection });

submissionQueue.on("waiting", (job) => logger.info({ jobId: job.id }, "Job enqueued"));
submissionQueue.on("error", (err) => logger.error({ err }, "Queue error"));

export { connection };
