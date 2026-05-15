import type { Request, Response } from "express";
import * as problemService from "../services/problem.js";

export async function listProblems(req: Request, res: Response) {
  // parse start/end query params, call service, return JSON
}

export async function getProblem(req: Request, res: Response) {
  // parse :id param, call service, return JSON or 404
}
