import { Worker, Job } from "bullmq";
import { connection } from "./config.js";
import { prisma } from "../db/connection.js";
import { logger } from "../utils/logger.js";
import { runCodeInSandbox, cleanupOrphanedContainers, cleanupSandboxDir, pullDockerImages } from "../services/executor.js";
import type { SubmissionStatus } from "../generated/prisma/enums.js";

async function processJob(job: Job) {
  const { submissionId, problemId, code, language } = job.data;

  logger.info({ submissionId }, "Processing submission...");

  try {
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
    const results = [];
    let passedCount = 0;
    let finalStatus: SubmissionStatus = "ACCEPTED";

    for (const tc of testCases) {
      const result = await runCodeInSandbox(
        code,
        language,
        tc.input,
        tc.expectedOutput,
      );

      results.push({
        testCaseId: tc.id,
        status: result.status,
        executionTime: result.executionTime,
        output: result.output,
      });

      if (result.status !== "ACCEPTED") {
        finalStatus = result.status;
      } else {
        passedCount++;
      }
    }

    // 4. Update submission with final results
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: finalStatus,
        results,
        totalTests: testCases.length,
        passedTests: passedCount,
      },
    });

    logger.info({ submissionId, status: finalStatus }, "Submission completed.");
  } catch (error) {
    logger.error({ error, submissionId }, "Job failed, marking as RUNTIME_ERROR");
    try {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "RUNTIME_ERROR" },
      });
    } catch (dbError) {
      logger.error({ error: dbError, submissionId }, "Failed to update submission status");
    }
  }
}

export const worker = new Worker("submission-queue", processJob, {
  connection,
});

// Cleanup on startup
async function initialize() {
  await cleanupOrphanedContainers();
  await cleanupSandboxDir();
  await pullDockerImages();
  logger.info("Worker started and listening for jobs...");
}

initialize();