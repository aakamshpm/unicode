import { prisma } from "../db/connection.js";
import { AppError } from "../middleware/error.js";

async function listContests() {
  const contests = await prisma.contest.findMany({
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      startTime: true,
      endTime: true,
      isActive: true,
    },
  });

  return contests.map((c) => ({
    ...c,
    status: getContestStatus(c.startTime, c.endTime),
  }));
}

async function getContest(slug: string) {
  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: {
      problems: {
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              slug: true,
              difficulty: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!contest) {
    throw new AppError("Contest not found", 404);
  }

  return {
    id: contest.id,
    title: contest.title,
    slug: contest.slug,
    description: contest.description,
    startTime: contest.startTime,
    endTime: contest.endTime,
    isActive: contest.isActive,
    status: getContestStatus(contest.startTime, contest.endTime),
    problems: contest.problems.map((cp) => ({
      id: cp.problem.id,
      title: cp.problem.title,
      slug: cp.problem.slug,
      difficulty: cp.problem.difficulty,
      points: cp.points,
      order: cp.order,
    })),
  };
}

async function createContest(data: {
  title: string;
  slug: string;
  description: string;
  startTime: Date;
  endTime: Date;
  isActive?: boolean;
}) {
  const existing = await prisma.contest.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new AppError("Contest with this slug already exists", 409);
  }

  if (data.endTime <= data.startTime) {
    throw new AppError("End time must be after start time", 400);
  }

  const contest = await prisma.contest.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      isActive: data.isActive ?? false,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      startTime: true,
      endTime: true,
      isActive: true,
    },
  });

  return {
    ...contest,
    status: getContestStatus(contest.startTime, contest.endTime),
  };
}

async function addProblemToContest(
  contestId: number,
  problemId: number,
  points: number,
  order: number,
) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) throw new AppError("Contest not found", 404);

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw new AppError("Problem not found", 404);

  if (points <= 0) throw new AppError("Points must be greater than 0", 400);

  const contestProblem = await prisma.contestProblem.create({
    data: {
      contestId,
      problemId,
      points,
      order,
    },
  });

  return contestProblem;
}

function getContestStatus(
  startTime: Date,
  endTime: Date,
): "UPCOMING" | "ACTIVE" | "ENDED" {
  const now = new Date();

  if (now < startTime) return "UPCOMING";
  if (now >= endTime) return "ENDED";

  return "ACTIVE";
}
export { listContests, getContest, createContest, addProblemToContest };
