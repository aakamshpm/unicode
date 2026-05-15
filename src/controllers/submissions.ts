import type { Request, Response } from "express";
import {
  createSubmission,
  fetchSubmissionStatus,
} from "../services/submission.js";
import { successResponse } from "../middleware/response.js";
import { AppError } from "../middleware/error.js";

const ALLOWED_LANGUAGES = ["javascript", "python"];

async function submitSolution(req: Request, res: Response) {
  const problemId = Number(req.params.id);
  const { code, language } = req.body;

  if (isNaN(problemId) || problemId <= 0) {
    throw new AppError("Invalid problem ID", 400);
  }

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    throw new AppError("Code is required", 400);
  }

  if (!language || !ALLOWED_LANGUAGES.includes(language)) {
    throw new AppError(
      `Invalid language. Allowed: ${ALLOWED_LANGUAGES.join(", ")}`,
      400,
    );
  }

  const submission = await createSubmission(problemId, code, language);

  // return with status code 202 because code execution is still in process and yet to complete
  res.status(202).json(
    successResponse({
      submissionId: submission.id, // submission.id is used for polling from client side
      status: submission.status,
    }),
  );
}

async function getSubmissionStatus(req: Request, res: Response) {
  const submissionId = Number(req.params.id);

  if (isNaN(submissionId) || submissionId <= 0) {
    throw new AppError("Invalid submission ID", 400);
  }

  const result = await fetchSubmissionStatus(submissionId);

  res.json(successResponse(result));
}

export { submitSolution, getSubmissionStatus };
