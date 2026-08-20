import { db } from "@/lib/db";
import { generateCourseForSession } from "@/services/course.service";

const JOB_LEASE_MS = 10 * 60 * 1000;
const RETRY_DELAYS_MS = [5_000, 30_000, 120_000] as const;
const FAILURE_MESSAGE =
  "Soma could not finish this learning path. Please try creating it again.";

export type ClaimedGenerationJob = {
  id: string;
  sessionId: string;
  attempts: number;
  maxAttempts: number;
};

export type GenerationJobResult = "completed" | "retrying" | "failed";

type ExpiredJob = {
  id: string;
  sessionId: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getRetryDelay(attempts: number): number {
  return RETRY_DELAYS_MS[
    Math.max(0, Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1))
  ];
}

export async function claimGenerationJob(
  workerId: string
): Promise<ClaimedGenerationJob | null> {
  const jobs = await db.$queryRaw<ClaimedGenerationJob[]>`
    WITH candidate AS (
      SELECT "id"
      FROM "GenerationJob"
      WHERE "status" = 'PENDING'
        AND "availableAt" <= NOW()
        AND "attempts" < "maxAttempts"
      ORDER BY "availableAt" ASC, "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE "GenerationJob" AS job
    SET
      "status" = 'RUNNING',
      "attempts" = job."attempts" + 1,
      "lockedAt" = NOW(),
      "lockedBy" = ${workerId},
      "updatedAt" = NOW()
    FROM candidate
    WHERE job."id" = candidate."id"
    RETURNING
      job."id",
      job."sessionId",
      job."attempts",
      job."maxAttempts"
  `;

  return jobs[0] ?? null;
}

export async function renewGenerationJobLease(
  jobId: string,
  workerId: string
): Promise<boolean> {
  const result = await db.generationJob.updateMany({
    where: {
      id: jobId,
      status: "RUNNING",
      lockedBy: workerId,
    },
    data: {
      lockedAt: new Date(),
    },
  });

  return result.count === 1;
}

export async function recoverExpiredGenerationJobs(): Promise<void> {
  const expiredBefore = new Date(Date.now() - JOB_LEASE_MS);

  await db.$transaction(async (transaction) => {
    const terminalJobs = await transaction.$queryRaw<ExpiredJob[]>`
      UPDATE "GenerationJob"
      SET
        "status" = 'FAILED',
        "lockedAt" = NULL,
        "lockedBy" = NULL,
        "lastError" = 'The generation worker stopped during its final attempt.',
        "completedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE "status" = 'RUNNING'
        AND "lockedAt" < ${expiredBefore}
        AND "attempts" >= "maxAttempts"
      RETURNING "id", "sessionId"
    `;

    for (const job of terminalJobs) {
      const currentSession = await transaction.learningSession.findUniqueOrThrow(
        {
          where: { id: job.sessionId },
          select: {
            status: true,
            courseId: true,
            course: { select: { status: true } },
          },
        }
      );

      if (
        currentSession.status === "COMPLETE" &&
        currentSession.course?.status === "PUBLISHED"
      ) {
        await transaction.generationJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            lastError: null,
          },
        });
        continue;
      }

      const session = await transaction.learningSession.update({
        where: { id: job.sessionId },
        data: {
          status: "FAILED",
          generationMessage: "Generation stopped",
          errorMessage: FAILURE_MESSAGE,
        },
        select: { courseId: true },
      });

      if (session.courseId) {
        await transaction.course.update({
          where: { id: session.courseId },
          data: { status: "FAILED" },
        });
      }
    }

    const retryableJobs = await transaction.$queryRaw<ExpiredJob[]>`
      UPDATE "GenerationJob"
      SET
        "status" = 'PENDING',
        "availableAt" = NOW(),
        "lockedAt" = NULL,
        "lockedBy" = NULL,
        "lastError" = 'The generation worker stopped before completing the job.',
        "updatedAt" = NOW()
      WHERE "status" = 'RUNNING'
        AND "lockedAt" < ${expiredBefore}
        AND "attempts" < "maxAttempts"
      RETURNING "id", "sessionId"
    `;

    for (const job of retryableJobs) {
      await transaction.learningSession.update({
        where: { id: job.sessionId },
        data: {
          generationMessage:
            "The generation worker restarted. Your path is queued again.",
        },
      });
    }
  });
}

async function completeGenerationJob(
  job: ClaimedGenerationJob,
  workerId: string
): Promise<void> {
  const result = await db.generationJob.updateMany({
    where: {
      id: job.id,
      status: "RUNNING",
      lockedBy: workerId,
    },
    data: {
      status: "COMPLETED",
      lockedAt: null,
      lockedBy: null,
      lastError: null,
      completedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new Error(`Generation job ${job.id} lost its worker lease`);
  }
}

async function retryGenerationJob(
  job: ClaimedGenerationJob,
  workerId: string,
  error: unknown
): Promise<void> {
  const availableAt = new Date(Date.now() + getRetryDelay(job.attempts));
  const lastError = getErrorMessage(error);

  await db.$transaction(async (transaction) => {
    const updatedJob = await transaction.generationJob.updateMany({
      where: {
        id: job.id,
        status: "RUNNING",
        lockedBy: workerId,
      },
      data: {
        status: "PENDING",
        availableAt,
        lockedAt: null,
        lockedBy: null,
        lastError,
      },
    });

    if (updatedJob.count !== 1) {
      throw new Error(`Generation job ${job.id} lost its worker lease`);
    }

    await transaction.learningSession.update({
      where: { id: job.sessionId },
      data: {
        generationMessage: "A generation step failed. Retrying automatically.",
        errorMessage: null,
      },
    });
  });
}

async function failGenerationJob(
  job: ClaimedGenerationJob,
  workerId: string,
  error: unknown
): Promise<void> {
  await db.$transaction(async (transaction) => {
    const updatedJob = await transaction.generationJob.updateMany({
      where: {
        id: job.id,
        status: "RUNNING",
        lockedBy: workerId,
      },
      data: {
        status: "FAILED",
        lockedAt: null,
        lockedBy: null,
        lastError: getErrorMessage(error),
        completedAt: new Date(),
      },
    });

    if (updatedJob.count !== 1) {
      throw new Error(`Generation job ${job.id} lost its worker lease`);
    }

    const session = await transaction.learningSession.update({
      where: { id: job.sessionId },
      data: {
        status: "FAILED",
        generationMessage: "Generation stopped",
        errorMessage: FAILURE_MESSAGE,
      },
      select: { courseId: true },
    });

    if (session.courseId) {
      await transaction.course.update({
        where: { id: session.courseId },
        data: { status: "FAILED" },
      });
    }
  });
}

export async function processGenerationJob(
  job: ClaimedGenerationJob,
  workerId: string
): Promise<GenerationJobResult> {
  try {
    await generateCourseForSession(job.sessionId);
    await completeGenerationJob(job, workerId);
    return "completed";
  } catch (error) {
    if (job.attempts < job.maxAttempts) {
      await retryGenerationJob(job, workerId, error);
      return "retrying";
    }

    await failGenerationJob(job, workerId, error);
    return "failed";
  }
}
