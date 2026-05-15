import { Router } from "express";
import { getSubmissionStatus } from "../controllers/submissions.js";

const router: Router = Router();

router.get("/:id/status", getSubmissionStatus);

export default router;
