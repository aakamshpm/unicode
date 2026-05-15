import { prisma } from "../db/connection.js";
import { AppError } from "../middleware/error.js";

export async function createSubmission(
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
