import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../config/env.js";

const connection = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  maxRetriesPerRequest: null, // Required for BullMQ
});

connection.on("connect", () => console.log("Redis connected"));
connection.on("error", (err) =>
  console.error("❌ Redis connection error:", err),
);

export const submissionQueue = new Queue("submission-queue", { connection });

submissionQueue.on("waiting", (job) => console.log(`Job ${job.id} enqueued`));
submissionQueue.on("error", (err) => console.error("❌ Queue error:", err));

export { connection };
