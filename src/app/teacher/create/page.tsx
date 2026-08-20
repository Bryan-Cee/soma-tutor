"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  Loader2,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    topic: "",
    specificInterests: "",
    knowledgeLevel: "beginner" as "beginner" | "intermediate" | "advanced",
    learningStyle: "reading" as "reading" | "examples" | "exercises" | "walkthrough",
    timeBudget: "multi_day" as "15min" | "1hour" | "multi_day",
  });

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          goal: "master_subject",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }

      const { sessionId } = await res.json();
      router.push(`/learn/generating/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function setKnowledgeLevel(value: string): void {
    if (
      value === "beginner" ||
      value === "intermediate" ||
      value === "advanced"
    ) {
      setForm({ ...form, knowledgeLevel: value });
    }
  }

  function setLearningStyle(value: string): void {
    if (
      value === "reading" ||
      value === "examples" ||
      value === "exercises" ||
      value === "walkthrough"
    ) {
      setForm({ ...form, learningStyle: value });
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeading
        eyebrow="AI course studio"
        title="Create a complete course"
        description="Define the audience and teaching approach. Soma will structure the modules, lessons, sources, and knowledge checks."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_19rem]">
        <Card className="border-2 border-foreground/10">
          <CardHeader className="border-b bg-muted/35">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <WandSparkles className="size-5" />
              </span>
              <CardTitle className="text-xl">Course brief</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <Label htmlFor="course-topic" className="mb-2">
                  Course topic
                </Label>
                <Input
                  id="course-topic"
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder='e.g. "Introduction to Machine Learning"'
                  className="h-12 text-base"
                  required
                />
              </div>

              <div>
                <Label htmlFor="course-focus" className="mb-2">
                  Specific areas to cover{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="course-focus"
                  value={form.specificInterests}
                  onChange={(e) =>
                    setForm({ ...form, specificInterests: e.target.value })
                  }
                  placeholder="e.g. supervised learning, neural networks, model evaluation..."
                  rows={4}
                  className="min-h-30"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="target-level" className="mb-2">
                    Target level
                  </Label>
                  <Select
                    value={form.knowledgeLevel}
                    onValueChange={setKnowledgeLevel}
                  >
                    <SelectTrigger id="target-level" className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="teaching-style" className="mb-2">
                    Teaching style
                  </Label>
                  <Select
                    value={form.learningStyle}
                    onValueChange={setLearningStyle}
                  >
                    <SelectTrigger id="teaching-style" className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reading">Reading-focused</SelectItem>
                      <SelectItem value="examples">Example-driven</SelectItem>
                      <SelectItem value="exercises">Exercise-heavy</SelectItem>
                      <SelectItem value="walkthrough">
                        Step-by-step walkthrough
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading || !form.topic.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generating course...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Generate course
                    <ArrowRight data-icon="inline-end" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit bg-secondary/45">
          <CardContent className="space-y-5 p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <BookOpenCheck className="size-6" />
            </span>
            <div>
              <p className="eyebrow">What Soma creates</p>
              <h2 className="mt-1 text-lg font-bold">
                A ready-to-teach structure
              </h2>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              {[
                "A sequenced module outline",
                "Complete lesson content",
                "Cited source material",
                "A quiz after every module",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-secondary-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
