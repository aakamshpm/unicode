import { Router } from "express";
import * as controller from "../controllers/problems.js";

const router: Router = Router();

router.get("/", controller.listProblems);
router.get("/:id", controller.getProblem);

export default router;
