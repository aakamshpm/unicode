import { Router } from "express";
import {
  listContestsHandler,
  getContestHandler,
  createContestHandler,
  addProblemToContestHandler,
} from "../controllers/contests.js";

const router: Router = Router();

router.get("/", listContestsHandler);
router.get("/:slug", getContestHandler);
router.post("/", createContestHandler);
router.post("/:id/problems", addProblemToContestHandler);

export default router;
