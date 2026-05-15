import { prisma } from "../db/connection.js";

export async function getProblems(start?: number, end?: number) {
  const skip = start ?? 0;
  const take = (end ?? skip + 10) - skip; // 10 rows are returned anyways by default

  return prisma.problem.findMany({
    skip,
    take,
    orderBy: { id: "asc" },
  });
}

export async function getProblemById(id: number) {
  return prisma.problem.findUnique({
    where: { id },
  });
}
