import { prisma } from "../db/connection.js";
import { AppError } from "../middleware/error.js";

async function createSubmission(
  problemId: number,
  code: string,
  language: string,
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
