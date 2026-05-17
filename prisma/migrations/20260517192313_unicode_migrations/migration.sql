/*
  Warnings:

  - A unique constraint covering the columns `[problemId,order]` on the table `TestCase` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Contest" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestProblem" (
    "id" SERIAL NOT NULL,
    "contestId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ContestProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestSubmission" (
    "id" SERIAL NOT NULL,
    "contestId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "wrongAttempts" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contest_slug_key" ON "Contest"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContestProblem_contestId_problemId_key" ON "ContestProblem"("contestId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestProblem_contestId_order_key" ON "ContestProblem"("contestId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContestSubmission_submissionId_key" ON "ContestSubmission"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestSubmission_contestId_userId_problemId_key" ON "ContestSubmission"("contestId", "userId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "TestCase_problemId_order_key" ON "TestCase"("problemId", "order");

-- AddForeignKey
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
