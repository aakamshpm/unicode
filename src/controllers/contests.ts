import type { Request, Response } from "express";
import {
  listContests,
  getContest,
  createContest,
  addProblemToContest,
} from "../services/contest.js";
import { successResponse } from "../middleware/response.js";
import { AppError } from "../middleware/error.js";

async function listContestsHandler(_req: Request, res: Response) {
  const contests = await listContests();
  res.json(successResponse(contests));
}

async function getContestHandler(req: Request, res: Response) {
  const { slug } = req.params;

  if (!slug || typeof slug !== "string")
    throw new AppError("Contest slug is required", 400);

  const contest = await getContest(slug);
  res.json(successResponse(contest));
}

async function createContestHandler(req: Request, res: Response) {
  const { title, slug, description, startTime, endTime, isActive } = req.body;

  if (!title || !slug || !description || !startTime || !endTime) {
    throw new AppError(
      "title, slug, description, startTime, and endTime are required",
      400,
    );
  }

  const contest = await createContest({
    title,
    slug,
    description,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    isActive: isActive ?? false,
  });

  res.status(201).json(successResponse(contest));
}

async function addProblemToContestHandler(req: Request, res: Response) {
  const contestId = Number(req.params.id);
  if (isNaN(contestId)) throw new AppError("Invalid contest ID", 400);

  const { problemId, points, order } = req.body;
  if (!problemId || !points || order === undefined) {
    throw new AppError("problemId, points, and order are required", 400);
  }

  const contestProblem = await addProblemToContest(
    contestId,
    problemId,
    points,
    order,
  );

  res.status(201).json(successResponse(contestProblem));
}

export {
  listContestsHandler,
  getContestHandler,
  createContestHandler,
  addProblemToContestHandler,
};
