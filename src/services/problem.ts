import { prisma } from "../db/connection.js";

export async function getProblems(start?: number, end?: number) {
  // return paginated problems from DB
}

export async function getProblemById(id: number) {
  // return single problem with all details
}
