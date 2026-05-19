import { prisma } from "../db/connection.js";
import type { SubmissionStatus } from "../generated/prisma/enums.js";
import { AppError } from "../middleware/error.js";
import { connection } from "../queue/config.js";
import { logger } from "../utils/logger.js";

const MULTIPLIER = 1_000_000;
const PENALTY_MINUTES = 5;

function encodeScore(
  points: number, // points = 300
  timeInMinutes: number, // time taken to solve = 20
  penalties: number, // wrong attemps = 2
): number {
  const effectiveTime = timeInMinutes + penalties * PENALTY_MINUTES; // 20 + (2 * 5) = 30 minutes
  return points * MULTIPLIER - effectiveTime; // (300 * 1_000_000) - 30 = 299_999_970
}

function decodeScore(score: number): { points: number; effectiveTime: number } {
  const points = Math.ceil(score / MULTIPLIER); // ceil(299_999_970 / 1_000_000) = ceil(299.99997) => 300
  const effectiveTime = points * MULTIPLIER - score; // 300_000_000 - 299_999_970 = 30

  return { points, effectiveTime };
}

// triggers for each problem submission in a contest
async function updateContestLeaderboard(
  contestId: number,
  userId: string,
  problemId: number,
  submissionId: number,
  status: SubmissionStatus,
) {
  // check contest exists
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) throw new AppError("Contest not found", 404);

  // check if contest active or not
  const now = new Date();
  if (now < contest.startTime || now >= contest.endTime) {
    logger.info(
      { contestId, userId },
      "Contest not active, skipping leaderboard update",
    );
    return;
  }

  // check if problem exists and it is part of the contest
  const contestProblem = await prisma.contestProblem.findUnique({
    where: { contestId_problemId: { contestId, problemId } },
    include: { problem: { select: { title: true, slug: true } } }, // we fetch problem details such as title/slug to cache later
  });
  if (!contestProblem) {
    logger.info(
      { contestId, problemId },
      "Problem not part of contest, skipping",
    );
    return;
  }

  // check if a submission was done for this problem
  let contestSubmission = await prisma.contestSubmission.findUnique({
    where: { contestId_userId_problemId: { contestId, userId, problemId } },
  });

  // if not submission was created yet, create new one
  if (!contestSubmission) {
    contestSubmission = await prisma.contestSubmission.create({
      data: {
        contestId,
        userId,
        problemId,
        submissionId,
        status,
        wrongAttempts: status !== "ACCEPTED" ? 1 : 0,
        solvedAt: status === "ACCEPTED" ? now : null,
      },
    });
  } else {
    // if a submission exists, check if it was already solved; if yes -> skip updation
    if (contestSubmission.solvedAt) {
      logger.info({ userId, problemId }, "Problem already solved, skipping");
      return;
    }

    const newWrongAttempts =
      status !== "ACCEPTED"
        ? contestSubmission.wrongAttempts + 1
        : contestSubmission.wrongAttempts;

    // while updating exisinting submission, we re assign contextSubmission with fresh value from DB
    contestSubmission = await prisma.contestSubmission.update({
      where: { id: contestSubmission.id },
      data: {
        status,
        wrongAttempts: newWrongAttempts,
        solvedAt: status === "ACCEPTED" ? now : contestSubmission.solvedAt,
      },
    });
  }

  // fetch and update redis cache/zset accordingly
  if (status === "ACCEPTED") {
    const minutesSinceStart = Math.floor(
      (now.getTime() - contest.startTime.getTime()) / 60000,
      //(2:45 PM in ms) - (2:00 PM in ms) = 2,700,000ms
      // 2, 700,000 / 60,000 = 45 minutes
    );

    const userData = await connection.hgetall(
      `contest:${contestId}:user:${userId}`,
    );

    const totalPoints =
      parseInt(userData?.totalPoints || "0", 10) + contestProblem.points;
    const lastSolvedTime = Math.max(
      parseInt(userData?.lastSolvedTime || "0", 10),
      minutesSinceStart,
    );
    const totalPenalties =
      parseInt(userData?.totalPenalties || "0", 10) +
      contestSubmission.wrongAttempts; // existing problems wrong attempts + current probems wrong attempts

    const existingSolved: { title: string; slug: string }[] =
      userData?.solvedProblems ? JSON.parse(userData.solvedProblems) : [];

    existingSolved.push({
      title: contestProblem.problem.title,
      slug: contestProblem.problem.slug,
    });

    await connection.hset(`contest:${contestId}:user:${userId}`, {
      totalPoints: totalPoints.toString(),
      lastSolvedTime: lastSolvedTime.toString(),
      totalPenalties: totalPenalties.toString(),
      solvedProblems: JSON.stringify(existingSolved),
    });

    const compositeScore = encodeScore(
      totalPoints,
      lastSolvedTime,
      totalPenalties,
    );

    // eg. "rohit": 499999940
    await connection.zadd(
      `contest:${contestId}:leaderboard`,
      compositeScore,
      userId,
    );

    logger.info(
      { contestId, userId, score: compositeScore, totalPoints },
      "Leaderboard updated",
    );
  }
}

// get top N rankings
async function getLeaderboard(contestId: number, limit = 50) {
  // check if contest exists
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) throw new AppError("Contest not found", 404);

  // ZREVRANGE reads from the Redis ZSET (skip list) in descending score order
  // internally this starts at the +Infinity sentinel in S0 and walks prev pointers
  // 0         → start from rank 1 (highest score)
  // limit - 1 → stop at rank 50 (0-indexed, so limit=50 means indices 0..49)
  // WITHSCORES → include the composite score alongside each userId in the result
  // returns a flat array: ["rohit", "499999940", "alice", "399999960", ...]
  const raw = await connection.zrevrange(
    `contest:${contestId}:leaderboard`,
    0,
    limit - 1,
    "WITHSCORES",
  );
  // no submissions yet, or contest leaderboard key doesn't exist in Redis
  if (raw.length === 0) return [];

  // ZREVRANGE WITHSCORES returns a flat array: [userId, score, userId, score, ...]
  // even indices (0, 2, 4...) = userIds
  // odd indices  (1, 3, 5...) = scores

  const userIds: string[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    // even indices represent userIds
    const userId = raw[i];
    if (typeof userId !== "string") continue;

    userIds.push(userId);
  }

  // pipeline batches all HGETALLs into one Redis round trip
  const pipeline = connection.pipeline();
  userIds.forEach((userId) => {
    pipeline.hgetall(`contest:${contestId}:user:${userId}`);
  });
  const results = await pipeline.exec();

  const leaderboard = [];

  for (let i = 0; i < raw.length; i += 2) {
    // i += 2 jumps to the next userId, skipping the score in between

    // raw[0]="rohit", raw[2]="alice", raw[4]="bob"...
    const userId = raw[i];

    // raw[1]="499999940", raw[3]="399999960"...
    const score = parseInt(String(raw[i + 1]), 10);

    // unpack composite score back into human-readable values
    // e.g. 499999940 → { points: 500, effectiveTime: 60 }
    const { points, effectiveTime } = decodeScore(score);

    // pipeline.exec() at above returns an array of tuples: [[error, data], [error, data], ...]
    // one tuple per HGETALL call, in the same order we pushed to the pipeline
    //
    // i/2 maps the flat raw index back to the pipeline index:
    //   i=0 → i/2=0 → results[0] → rohit's HGETALL result
    //   i=2 → i/2=1 → results[1] → alice's HGETALL result
    //   i=4 → i/2=2 → results[2] → bob's HGETALL result
    //
    // [1] picks the data from the tuple (index 0 = error, index 1 = data)
    // ?. optional chaining handles the case where pipeline result is null/undefined
    const userData = results?.[i / 2]?.[1] as Record<string, string> | null;

    // solvedProblems is stored as a JSON string in the Redis hash
    // e.g. '[{"title":"Two Sum","slug":"two-sum"},{"title":"FizzBuzz","slug":"fizzbuzz"}]'
    // parse it back into an array, or default to [] if this user has no solved problems
    const solvedProblems: { title: string; slug: string }[] =
      userData?.solvedProblems ? JSON.parse(userData.solvedProblems) : [];

    // push this user's entry into the leaderboard array
    // rank is just the current position - works because ZREVRANGE already returned users in descending score order, so first pushed = rank 1
    leaderboard.push({
      rank: leaderboard.length + 1,
      userId,
      points,
      effectiveTime,
      solvedCount: solvedProblems.length,
      solvedProblems,
    });
  }

  return leaderboard;
}

export { updateContestLeaderboard, getLeaderboard, encodeScore, decodeScore };
