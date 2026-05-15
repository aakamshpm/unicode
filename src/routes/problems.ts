import { Router } from "express";
import { listProblems, getProblem } from "../controllers/problems.js";
import { submitSolution } from "../controllers/submission.js";

const router: Router = Router();

router.get("/", listProblems);
router.get("/:id", getProblem);

router.post("/:id/submission", submitSolution);

export default router;
