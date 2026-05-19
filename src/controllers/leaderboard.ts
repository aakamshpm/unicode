import type { Request, Response } from "express";
import { getLeaderboard } from "../services/leaderboard.js";
import { successResponse } from "../middleware/response.js";
import { AppError } from "../middleware/error.js";

async function getContestLeaderboard(req: Request, res: Response) {
  const contestId = Number(req.params.id);

  if (isNaN(contestId) || contestId <= 0) {
    throw new AppError("Invalid contest ID", 400);
  }

  const limit = req.query.limit ? Number(req.query.limit) : 50;

  if (isNaN(limit) || limit <= 0) {
    throw new AppError("Invalid limit", 400);
  }

  const leaderboard = await getLeaderboard(contestId, Math.min(limit, 50));
  res.json(successResponse(leaderboard));
}

export { getContestLeaderboard };
