"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Clock,
  Loader2,
  Target,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type Step = "interests" | "level" | "style" | "goal" | "time" | "confirm";

const STEPS: Step[] = ["interests", "level", "style", "goal", "time", "confirm"];

export default function OnboardingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topic = searchParams.get("topic") ?? "";

  const [currentStep, setCurrentStep] = useState<Step>("interests");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    topic,
    specificInterests: "",
    knowledgeLevel: "" as "" | "beginner" | "intermediate" | "advanced",
    learningStyle: "" as "" | "reading" | "examples" | "exercises" | "walkthrough",
    goal: "" as "" | "quick_quiz" | "learn_concept" | "master_subject",
    timeBudget: "" as "" | "15min" | "1hour" | "multi_day",
  });

  const stepIndex = STEPS.indexOf(currentStep);

  function canProceed(): boolean {
    switch (currentStep) {
      case "interests":
        return form.topic.trim().length > 0;
      case "level":
        return form.knowledgeLevel !== "";
      case "style":
        return form.learningStyle !== "";
      case "goal":
        return form.goal !== "";
      case "time":
        return form.timeBudget !== "";
      case "confirm":
        return true;
    }
  }

  function nextStep() {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
    }
  }

  function prevStep() {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1]);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic,
          specificInterests: form.specificInterests || undefined,
          knowledgeLevel: form.knowledgeLevel,
          learningStyle: form.learningStyle,
          goal: form.goal,
          timeBudget: form.timeBudget,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }

      const { courseId } = await res.json();
      router.push(`/course/${courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 text-center">
        <Badge variant="secondary" className="mb-4">
          Personalize your path
        </Badge>
        <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
          Let&apos;s build the right way to learn
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          A few quick choices help Soma match the depth, pace, and format to
          you.
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm text-muted-foreground">
          <span>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <span className="font-semibold text-foreground">
            {Math.round(((stepIndex + 1) / STEPS.length) * 100)}%
          </span>
        </div>
        <Progress
          value={((stepIndex + 1) / STEPS.length) * 100}
          className="h-3"
        />
      </div>

      <Card className="border-2 border-foreground/10 shadow-[0_16px_45px_-34px_oklch(0.22_0.026_72/0.55)]">
        <CardContent className="p-6 sm:p-8">
        {currentStep === "interests" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <BookOpen className="size-5" />
              </span>
              <div>
                <p className="eyebrow">Start with curiosity</p>
                <h2 className="text-xl font-bold">What do you want to learn?</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic" className="mb-2">
                  Topic
                </Label>
                <Input
                  id="topic"
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder='e.g. "Quantum computing"'
                  className="h-12 text-base"
                />
              </div>
              <div>
                <Label htmlFor="interests" className="mb-2">
                  Any specific areas you want to focus on? (optional)
                </Label>
                <Textarea
                  id="interests"
                  value={form.specificInterests}
                  onChange={(e) =>
                    setForm({ ...form, specificInterests: e.target.value })
                  }
                  placeholder="e.g. quantum entanglement, qubits, quantum gates..."
                  rows={3}
                  className="min-h-28"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === "level" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <Brain className="size-5" />
              </span>
              <div>
                <p className="eyebrow">Set the depth</p>
                <h2 className="text-xl font-bold">
                  What is your current knowledge level?
                </h2>
              </div>
            </div>
            <div className="space-y-3">
              {[
                {
                  value: "beginner" as const,
                  label: "Beginner",
                  desc: "New to this topic, start from the basics",
                },
                {
                  value: "intermediate" as const,
                  label: "Intermediate",
                  desc: "Have some knowledge, want to go deeper",
                },
                {
                  value: "advanced" as const,
                  label: "Advanced",
                  desc: "Experienced, looking for advanced concepts",
                },
              ].map((option) => (
                <Button
                  type="button"
                  key={option.value}
                  onClick={() =>
                    setForm({ ...form, knowledgeLevel: option.value })
                  }
                  aria-pressed={form.knowledgeLevel === option.value}
                  variant={
                    form.knowledgeLevel === option.value
                      ? "secondary"
                      : "outline"
                  }
                  className="h-auto w-full justify-start whitespace-normal border-2 p-4 text-left"
                >
                  <span>
                    <span className="block font-bold">{option.label}</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      {option.desc}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "style" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Zap className="size-5" />
              </span>
              <div>
                <p className="eyebrow">Choose the format</p>
                <h2 className="text-xl font-bold">
                  How do you prefer to learn?
                </h2>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  value: "reading" as const,
                  label: "Reading",
                  desc: "Detailed written explanations",
                },
                {
                  value: "examples" as const,
                  label: "Examples",
                  desc: "Learn through real-world examples",
                },
                {
                  value: "exercises" as const,
                  label: "Exercises",
                  desc: "Hands-on practice and challenges",
                },
                {
                  value: "walkthrough" as const,
                  label: "Walkthrough",
                  desc: "Step-by-step guided instructions",
                },
              ].map((option) => (
                <Button
                  type="button"
                  key={option.value}
                  onClick={() =>
                    setForm({ ...form, learningStyle: option.value })
                  }
                  aria-pressed={form.learningStyle === option.value}
                  variant={
                    form.learningStyle === option.value
                      ? "secondary"
                      : "outline"
                  }
                  className="h-auto justify-start whitespace-normal border-2 p-4 text-left"
                >
                  <span>
                    <span className="block font-bold">{option.label}</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      {option.desc}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "goal" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <Target className="size-5" />
              </span>
              <div>
                <p className="eyebrow">Define success</p>
                <h2 className="text-xl font-bold">What is your goal?</h2>
              </div>
            </div>
            <div className="space-y-3">
              {[
                {
                  value: "quick_quiz" as const,
                  label: "Quick Quiz",
                  desc: "Test my knowledge with a set of questions",
                },
                {
                  value: "learn_concept" as const,
                  label: "Learn a Concept",
                  desc: "Get a structured lesson on the topic",
                },
                {
                  value: "master_subject" as const,
                  label: "Master the Subject",
                  desc: "Full course with modules, lessons, and quizzes",
                },
              ].map((option) => (
                <Button
                  type="button"
                  key={option.value}
                  onClick={() => setForm({ ...form, goal: option.value })}
                  aria-pressed={form.goal === option.value}
                  variant={form.goal === option.value ? "secondary" : "outline"}
                  className="h-auto w-full justify-start whitespace-normal border-2 p-4 text-left"
                >
                  <span>
                    <span className="block font-bold">{option.label}</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      {option.desc}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "time" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Clock className="size-5" />
              </span>
              <div>
                <p className="eyebrow">Set the pace</p>
                <h2 className="text-xl font-bold">
                  How much time do you have?
                </h2>
              </div>
            </div>
            <div className="space-y-3">
              {[
                {
                  value: "15min" as const,
                  label: "15 minutes",
                  desc: "Quick overview or short quiz",
                },
                {
                  value: "1hour" as const,
                  label: "1 hour",
                  desc: "In-depth lesson or detailed quiz",
                },
                {
                  value: "multi_day" as const,
                  label: "Multi-day course",
                  desc: "Comprehensive course to study over time",
                },
              ].map((option) => (
                <Button
                  type="button"
                  key={option.value}
                  onClick={() =>
                    setForm({ ...form, timeBudget: option.value })
                  }
                  aria-pressed={form.timeBudget === option.value}
                  variant={
                    form.timeBudget === option.value ? "secondary" : "outline"
                  }
                  className="h-auto w-full justify-start whitespace-normal border-2 p-4 text-left"
                >
                  <span>
                    <span className="block font-bold">{option.label}</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      {option.desc}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "confirm" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
                <Zap className="size-5" />
              </span>
              <div>
                <p className="eyebrow">Ready to build</p>
                <h2 className="text-xl font-bold">
                  Review your learning path
                </h2>
              </div>
            </div>
            <div className="mb-6 space-y-3 rounded-xl border bg-muted/55 p-5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Topic</span>
                <span className="font-semibold">{form.topic}</span>
              </div>
              {form.specificInterests && (
                <div className="flex justify-between gap-6">
                  <span className="text-muted-foreground">Focus</span>
                  <span className="max-w-sm text-right font-semibold">
                    {form.specificInterests}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className="font-semibold capitalize">
                  {form.knowledgeLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Style</span>
                <span className="font-semibold capitalize">
                  {form.learningStyle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goal</span>
                <span className="font-semibold">
                  {form.goal === "quick_quiz"
                    ? "Quick Quiz"
                    : form.goal === "learn_concept"
                      ? "Learn a Concept"
                      : "Full Course"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-semibold">
                  {form.timeBudget === "15min"
                    ? "15 minutes"
                    : form.timeBudget === "1hour"
                      ? "1 hour"
                      : "Multi-day"}
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={stepIndex === 0}
            className="shadow-none"
          >
            <ArrowLeft />
            Back
          </Button>

          {currentStep === "confirm" ? (
            <Button
              type="button"
              size="lg"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate
                  <Zap data-icon="inline-end" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continue
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
