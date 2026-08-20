"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  CircleAlert,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type GenerationSnapshot = {
  id: string;
  topic: string;
  status: "QUESTIONNAIRE" | "GENERATING" | "COMPLETE" | "FAILED";
  generationProgress: number;
  generationMessage: string | null;
  errorMessage: string | null;
  course: {
    id: string;
    title: string;
    status: "DRAFT" | "GENERATING" | "PUBLISHED" | "FAILED" | "ARCHIVED";
  } | null;
};

type GenerationStatusProps = {
  dashboardHref: string;
  initialSnapshot: GenerationSnapshot;
};

function PlayfulLoader(): React.ReactNode {
  return (
    <div className="relative mx-auto size-48" aria-hidden="true">
      <div className="absolute inset-2 animate-spin rounded-full border-2 border-dashed border-primary/45 [animation-duration:8s]" />
      <div className="absolute inset-7 animate-spin rounded-full border-4 border-secondary-foreground/25 border-t-secondary-foreground [animation-direction:reverse] [animation-duration:3s]" />
      <span className="absolute top-1/2 left-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-[0_16px_35px_-18px_var(--primary-shadow)] motion-safe:animate-pulse">
        <Brain className="size-9" />
      </span>
      <span className="absolute top-3 left-7 grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm motion-safe:animate-bounce">
        <Sparkles className="size-5" />
      </span>
      <span className="absolute right-1 bottom-10 grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground shadow-sm motion-safe:animate-bounce [animation-delay:300ms]">
        <BookOpen className="size-5" />
      </span>
    </div>
  );
}

export function GenerationStatus({
  dashboardHref,
  initialSnapshot,
}: GenerationStatusProps): React.ReactNode {
  const [snapshot, setSnapshot] =
    useState<GenerationSnapshot>(initialSnapshot);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (snapshot.status === "COMPLETE" || snapshot.status === "FAILED") {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll(): Promise<void> {
      try {
        const response = await fetch(`/api/generation/${initialSnapshot.id}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Generation status is unavailable");
        }

        const nextSnapshot: GenerationSnapshot = await response.json();
        if (cancelled) return;

        setSnapshot(nextSnapshot);
        setPollError(null);
        if (
          nextSnapshot.status !== "COMPLETE" &&
          nextSnapshot.status !== "FAILED"
        ) {
          timeoutId = setTimeout(poll, 2_500);
        }
      } catch {
        if (cancelled) return;
        setPollError("Status updates are delayed. Soma will keep checking.");
        timeoutId = setTimeout(poll, 5_000);
      }
    }

    timeoutId = setTimeout(poll, 1_000);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initialSnapshot.id, snapshot.status]);

  const isComplete =
    snapshot.status === "COMPLETE" &&
    snapshot.course?.status === "PUBLISHED";
  const isFailed =
    snapshot.status === "FAILED" || snapshot.course?.status === "FAILED";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,oklch(0.93_0.06_52/0.65),transparent_28rem),radial-gradient(circle_at_85%_85%,oklch(0.93_0.052_145/0.7),transparent_30rem)]" />
      <main className="relative mx-auto flex min-h-full w-full max-w-3xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full overflow-hidden border-2 border-foreground/10 bg-card/95 shadow-[0_30px_80px_-45px_oklch(0.22_0.026_72/0.65)]">
          <div className="h-2 bg-gradient-to-r from-primary via-primary/65 to-secondary-foreground/60" />
          <CardContent className="p-6 text-center sm:p-10">
            {isComplete ? (
              <span className="mx-auto mb-7 grid size-24 place-items-center rounded-3xl bg-secondary text-secondary-foreground">
                <CheckCircle2 className="size-12" />
              </span>
            ) : isFailed ? (
              <span className="mx-auto mb-7 grid size-24 place-items-center rounded-3xl bg-destructive/10 text-destructive">
                <CircleAlert className="size-12" />
              </span>
            ) : (
              <PlayfulLoader />
            )}

            <Badge
              variant={isComplete ? "secondary" : isFailed ? "destructive" : "outline"}
              className="mb-4"
            >
              {isComplete
                ? "Ready to learn"
                : isFailed
                  ? "Generation stopped"
                  : "Soma is building"}
            </Badge>
            <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              {isComplete
                ? "Your learning path is ready"
                : isFailed
                  ? "This path needs another try"
                  : `Creating your path for ${snapshot.topic}`}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              {isComplete
                ? `${snapshot.course?.title ?? snapshot.topic} is ready when you are.`
                : isFailed
                  ? snapshot.errorMessage
                  : "A complete course can take a while. You can leave this page and return from your dashboard at any time."}
            </p>

            {!isComplete && !isFailed && (
              <div className="mx-auto mt-8 max-w-xl rounded-2xl border bg-muted/55 p-5 text-left">
                <div className="mb-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold">
                    {snapshot.generationMessage ?? "Preparing your learning path"}
                  </span>
                  <span className="font-bold text-primary">
                    {snapshot.generationProgress}%
                  </span>
                </div>
                <Progress
                  value={snapshot.generationProgress}
                  className="h-3"
                />
              </div>
            )}

            {pollError && !isComplete && !isFailed && (
              <Alert className="mx-auto mt-5 max-w-xl text-left">
                <AlertDescription>{pollError}</AlertDescription>
              </Alert>
            )}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {isComplete && snapshot.course && (
                <Button asChild size="lg">
                  <Link href={`/course/${snapshot.course.id}`}>
                    Open learning path
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              )}
              {isFailed && (
                <Button asChild size="lg">
                  <Link href="/learn/onboarding">
                    Create another path
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant={isComplete || isFailed ? "outline" : "secondary"}
              >
                <Link href={dashboardHref}>
                  <LayoutDashboard />
                  Go to dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
