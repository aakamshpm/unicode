import { prisma } from "../db/connection.js";
import { AppError } from "../middleware/error.js";
import { submissionQueue } from "../queue/config.js";

async function createSubmission(
  problemId: number,
  code: string,
  language: string,
  userId: string,
) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });

  if (!problem) {
    throw new AppError("Problem not found", 404);
  }

  const submission = await prisma.submission.create({
    data: {
      problemId,
      code,
      language,
      status: "PENDING", // status is set to PENDING as the code is Queued at first
    },
  });

  const now = new Date();
  const activeContest = await prisma.contest.findFirst({
    where: {
      isActive: true, // contest must be active
      startTime: { lte: now }, // contest start time must be less than or equal to createSubmission time
      endTime: { gt: now }, // contest end time must be greater than createSubmission time
      problems: { some: { problemId } }, // there should exist a problemId with passed one
    },
  });

  // add the submission to Queue
  await submissionQueue.add("execute-code", {
    submissionId: submission.id,
    problemId,
    code,
    language,
    userId,
    contestId: activeContest?.id ?? null,
  });

  return submission;
}

async function fetchSubmissionStatus(submissionId: number) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      status: true,
      results: true,
      totalTests: true,
      passedTests: true,
    },
  });

  if (!submission) {
    throw new AppError("Submission not found", 404);
  }

  return submission;
}

export { createSubmission, fetchSubmissionStatus };
