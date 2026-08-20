-- CreateEnum
CREATE TYPE "CourseVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "visibility" "CourseVisibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable
CREATE TABLE "CourseShareLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseShareLink_token_key" ON "CourseShareLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CourseShareLink_courseId_key" ON "CourseShareLink"("courseId");

-- AddForeignKey
ALTER TABLE "CourseShareLink" ADD CONSTRAINT "CourseShareLink_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
