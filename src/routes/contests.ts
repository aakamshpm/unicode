import { Router } from "express";
import {
  listContestsHandler,
  getContestHandler,
  createContestHandler,
  addProblemToContestHandler,
} from "../controllers/contests.js";
import { getContestLeaderboard } from "../controllers/leaderboard.js";

const router: Router = Router();

router.get("/", listContestsHandler);
router.get("/:slug", getContestHandler);
router.post("/", createContestHandler);
router.post("/:id/problems", addProblemToContestHandler);
router.get("/:id/leaderboard", getContestLeaderboard);

export default router;
