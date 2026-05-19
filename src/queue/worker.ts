import { Worker, Job } from "bullmq";
import { connection } from "./config.js";
import { prisma } from "../db/connection.js";
import { logger } from "../utils/logger.js";
import {
  runCodeInSandbox,
  cleanupOrphanedContainers,
  cleanupSandboxDir,
  pullDockerImages,
} from "../services/executor.js";
import type { SubmissionStatus } from "../generated/prisma/enums.js";
import { updateContestLeaderboard } from "../services/leaderboard.js";

// each job represents one user's code submission for one problem
async function processJob(job: Job) {
  const { submissionId, problemId, code, language } = job.data;

  logger.info({ submissionId }, "Processing submission...");

  // Declared outside the below try block so it's accessible for leaderboard update after catch
  let finalStatus: SubmissionStatus = "ACCEPTED";

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

    // 3. Execute code against each test case in a Docker sandbox
    const results = [];
    let passedCount = 0;

    for (const tc of testCases) {
      // each test case runs in an isolated container
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

      // First non-ACCEPTED result becomes the final status
      // e.g., if test 1 passes but test 2 times out → finalStatus = TIMEOUT
      if (result.status !== "ACCEPTED") {
        finalStatus = result.status;
      } else {
        passedCount++;
      }
    }

    // 4. update final results to the submission record
    // this is what the polling endpoint (GET /submissions/:id/status) returns
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
    logger.error(
      { error, submissionId },
      "Job failed, marking as RUNTIME_ERROR",
    );
    try {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "RUNTIME_ERROR" },
      });
    } catch (dbError) {
      logger.error(
        { error: dbError, submissionId },
        "Failed to update submission status",
      );
    }
  }

  // 5. Update contest leaderboard if this problem belongs to an active contest
  // Separated from main try/catch so leaderboard failures don't corrupt submission status
  if (job.data.contestId && job.data.userId) {
    try {
      await updateContestLeaderboard(
        job.data.contestId,
        job.data.userId,
        problemId,
        submissionId,
        finalStatus,
      );
    } catch (err) {
      logger.error(
        { err, contestId: job.data.contestId },
        "Leaderboard update failed",
      );
    }
  }
}

// Worker instance - pulls jobs from Redis queue and runs processJob for each
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
