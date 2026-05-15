import { Worker, Job } from "bullmq";
import { connection } from "./config.js";
import { prisma } from "../db/connection.js";
import { logger } from "../utils/logger.js";

async function processJob(job: Job) {
  const { submissionId, problemId, code, language } = job.data;

  logger.info({ submissionId }, "Processing submission...");

  // 1. Update status to RUNNING
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "RUNNING" },
  });

  // 2. Fetch test cases for this problem
  const testCases = await prisma.testCase.findMany({
    where: { problemId },
    orderBy: { order: "asc" },
  });

  // 3. Execute code
  // For now, we simulate a successful run
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 4. Prepare results
  const results = testCases.map((tc) => ({
    testCaseId: tc.id,
    status: "PASSED",
    executionTime: Math.floor(Math.random() * 50) + 10,
  }));

  // 5. Update submission with final results
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: "ACCEPTED",
      results,
      totalTests: testCases.length,
      passedTests: testCases.length,
    },
  });

  logger.info({ submissionId }, "Submission completed successfully.");
}

export const worker = new Worker("submission-queue", processJob, {
  connection,
});

logger.info("Worker started and listening for jobs...");
