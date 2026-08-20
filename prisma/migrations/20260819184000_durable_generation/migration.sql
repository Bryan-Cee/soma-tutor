-- AlterEnum
ALTER TYPE "CourseStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "LearningSession" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "generationMessage" TEXT,
ADD COLUMN     "generationProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "triggerRunId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LearningSession_triggerRunId_key" ON "LearningSession"("triggerRunId");

-- CreateIndex
CREATE INDEX "LearningSession_courseId_idx" ON "LearningSession"("courseId");
