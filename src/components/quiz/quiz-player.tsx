"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import type { QuestionDetail, QuizResult } from "@/types/quiz";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  quizId: string;
  questions: QuestionDetail[];
};

export function QuizPlayer({ quizId, questions }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const question = questions[currentIndex];
  const answered = question ? question.id in answers : false;
  const allAnswered = questions.every((q) => q.id in answers);

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });

      if (!res.ok) throw new Error("Submission failed");

      const data: QuizResult = await res.json();
      setResult(data);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The quiz could not be submitted"
      );
      setSubmitting(false);
    }
  }

  function resetQuiz(): void {
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setError(null);
    setSubmitting(false);
  }

  if (result) {
    const percentage = Math.round((result.score / result.maxScore) * 100);
    return (
      <div className="space-y-8">
        <Card className="border-2 border-foreground/10 text-center">
          <CardContent className="flex flex-col items-center p-8">
            <span
              className={`grid size-24 place-items-center rounded-full text-3xl font-bold ${
                percentage >= 70
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              {percentage}%
            </span>
            <h2 className="mt-5 text-2xl font-bold">
              {percentage >= 90
                ? "Excellent work"
                : percentage >= 70
                  ? "Strong progress"
                  : "Keep building"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              You answered {result.score} of {result.maxScore} questions
              correctly.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6"
              onClick={resetQuiz}
            >
              <RotateCcw />
              Try again
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result.results.map((r, i) => {
            const q = questions.find((q) => q.id === r.questionId);
            return (
              <Card
                key={r.questionId}
                className={
                  r.correct
                    ? "bg-secondary/35"
                    : "border-destructive/30 bg-destructive/5"
                }
              >
                <CardContent className="p-5">
                  <div className="mb-2 flex items-start gap-3">
                  {r.correct ? (
                      <CheckCircle className="mt-0.5 size-5 shrink-0 text-secondary-foreground" />
                  ) : (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                  )}
                    <p className="font-semibold">
                    {i + 1}. {q?.prompt}
                  </p>
                </div>
                {!r.correct && (
                    <div className="ml-8 space-y-1 text-sm">
                      <p className="text-destructive">
                      Your answer: {r.userAnswer}
                    </p>
                      <p className="text-secondary-foreground">
                      Correct answer: {r.correctAnswer}
                    </p>
                  </div>
                )}
                  <p className="ml-8 mt-3 text-sm leading-6 text-muted-foreground">
                  {r.explanation}
                </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="font-semibold">
            {Object.keys(answers).length} answered
          </span>
        </div>
        <Progress
          value={((currentIndex + 1) / questions.length) * 100}
          className="h-3"
        />
      </div>

      <Card className="border-2 border-foreground/10">
        <CardHeader className="border-b bg-muted/35 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline" className="capitalize">
              {question.type.toLowerCase().replace("_", " ")}
            </Badge>
          </div>
          <CardTitle className="mt-3 text-xl leading-8 sm:text-2xl">
            {question.prompt}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">

        {question.type === "SHORT_ANSWER" ? (
            <Textarea
            value={answers[question.id] ?? ""}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={4}
              className="min-h-32 text-base"
          />
        ) : (
          <div className="space-y-3">
            {question.options.map((option) => (
                <Button
                  type="button"
                key={option}
                onClick={() => setAnswer(option)}
                  variant={
                    answers[question.id] === option ? "secondary" : "outline"
                  }
                  aria-pressed={answers[question.id] === option}
                  className="h-auto w-full justify-start whitespace-normal border-2 p-4 text-left"
              >
                {option}
                </Button>
            ))}
          </div>
        )}

          {error && (
            <Alert variant="destructive" className="mt-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-8 flex items-center justify-between border-t pt-6">
          <Button
              type="button"
              variant="ghost"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
              className="shadow-none"
          >
              <ArrowLeft />
            Previous
            </Button>

          {currentIndex === questions.length - 1 ? (
              <Button
                type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
            >
              {submitting ? (
                <>
                    <Loader2 className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
              </Button>
          ) : (
              <Button
                type="button"
              onClick={() =>
                setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={!answered}
            >
              Next
                <ArrowRight data-icon="inline-end" />
              </Button>
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
