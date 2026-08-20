import "dotenv/config";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { stopCopilotClient } from "@/lib/copilot/client";
import {
  claimGenerationJob,
  processGenerationJob,
  recoverExpiredGenerationJobs,
  renewGenerationJobLease,
  type ClaimedGenerationJob,
} from "@/services/generation-job.service";

const POLL_INTERVAL_MS = 1_000;
const LEASE_RENEWAL_MS = 30_000;
const RECOVERY_INTERVAL_MS = 60_000;

function writeMessage(message: string): void {
  process.stdout.write(`[generation-worker] ${message}\n`);
}

function writeError(error: unknown): void {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`[generation-worker] ${message}\n`);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runJob(
  job: ClaimedGenerationJob,
  workerId: string
): Promise<void> {
  let leaseLost = false;
  const leaseTimer = setInterval(() => {
    void renewGenerationJobLease(job.id, workerId)
      .then((renewed) => {
        if (!renewed) leaseLost = true;
      })
      .catch((error: unknown) => {
        leaseLost = true;
        writeError(error);
      });
  }, LEASE_RENEWAL_MS);

  try {
    writeMessage(
      `processing job ${job.id}, attempt ${job.attempts}/${job.maxAttempts}`
    );
    const result = await processGenerationJob(job, workerId);
    if (leaseLost) {
      writeMessage(`job ${job.id} ${result} after its lease was lost`);
    } else {
      writeMessage(`job ${job.id} ${result}`);
    }
  } finally {
    clearInterval(leaseTimer);
  }
}

async function main(): Promise<void> {
  const workerId = `${process.pid}-${randomUUID()}`;
  let stopping = false;
  let lastRecoveryAt = 0;

  const stop = (): void => {
    stopping = true;
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  writeMessage(`ready as ${workerId}`);

  try {
    while (!stopping) {
      const now = Date.now();
      if (now - lastRecoveryAt >= RECOVERY_INTERVAL_MS) {
        await recoverExpiredGenerationJobs();
        lastRecoveryAt = now;
      }

      const job = await claimGenerationJob(workerId);
      if (!job) {
        await wait(POLL_INTERVAL_MS);
        continue;
      }

      try {
        await runJob(job, workerId);
      } catch (error) {
        writeError(error);
        await wait(POLL_INTERVAL_MS);
      }
    }
  } finally {
    await stopCopilotClient();
    await db.$disconnect();
    writeMessage("stopped");
  }
}

main().catch((error: unknown) => {
  writeError(error);
  process.exitCode = 1;
});
