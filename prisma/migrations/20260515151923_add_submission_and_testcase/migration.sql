/*
  Warnings:

  - You are about to drop the column `testCases` on the `Problem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'TIMEOUT', 'COMPILATION_ERROR', 'RUNTIME_ERROR');

-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "testCases";

-- CreateTable
CREATE TABLE "TestCase" (
    "id" SERIAL NOT NULL,
    "problemId" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "problemId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "results" JSONB,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
