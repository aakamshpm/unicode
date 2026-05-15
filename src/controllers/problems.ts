import type { Request, Response } from "express";
import * as problemService from "../services/problem.js";
import { AppError } from "../middleware/error.js";
import { successResponse } from "../middleware/response.js";

export async function listProblems(req: Request, res: Response) {
  const start = req.query.start ? Number(req.query.start) : 0;
  const end = req.query.end ? Number(req.query.end) : undefined;

  if (isNaN(start) || start < 0) {
    throw new AppError("Invalid start parameter", 400);
  }

  // 'start' ends up with 0 value anyways, therefore we check if 'end' has value with end !== undefined
  if (end !== undefined && (isNaN(end) || end <= start)) {
    throw new AppError("Invalid end parameter", 400);
  }

  const problems = await problemService.getProblems(start, end);
  res.json(successResponse(problems, { count: problems.length }));
}

export async function getProblem(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (isNaN(id) || id <= 0) {
    throw new AppError("Invalid problem ID", 400);
  }

  const problem = await problemService.getProblemById(id);

  if (!problem) {
    throw new AppError("Problem not found", 404);
  }

  res.json(successResponse(problem));
}
