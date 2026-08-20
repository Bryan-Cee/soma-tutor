"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  Clock3,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const router = useRouter();
  const { isSignedIn } = useAuth();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    const encoded = encodeURIComponent(topic.trim());
    if (isSignedIn) {
      router.push(`/learn/onboarding?topic=${encoded}`);
    } else {
      router.push(`/sign-in?redirect_url=/learn/onboarding?topic=${encoded}`);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute -top-36 right-[-8rem] size-96 rounded-full bg-secondary/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-12rem] left-[-10rem] size-96 rounded-full bg-accent/60 blur-3xl" />

      <nav className="relative z-10 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="shadow-none">
              <Link href="/courses">Browse courses</Link>
            </Button>
            {isSignedIn ? (
              <Button asChild>
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="shadow-none">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
          <div>
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
              <Sparkles className="size-3.5" />
              Personal learning, built around you
            </Badge>
            <h1 className="max-w-3xl text-5xl leading-[0.98] font-bold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Turn curiosity into{" "}
              <span className="relative whitespace-nowrap text-primary">
                real progress.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 320 18"
                  className="absolute -bottom-3 left-0 w-full text-primary/35"
                >
                  <path
                    d="M5 12C80 3 218 3 315 9"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="7"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Tell Soma what you want to understand. Get a focused quiz, a
              guided lesson, or a complete course shaped to your pace and
              learning style.
            </p>

            <Card className="mt-9 max-w-2xl border-2 border-foreground/10 shadow-[0_14px_0_-8px_oklch(0.88_0.03_85)]">
              <CardContent className="p-3">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <div className="relative flex-1">
                    <BookOpen className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What do you want to learn?"
                      aria-label="Learning topic"
                      className="h-12 border-0 bg-muted/60 pl-12 text-base shadow-none focus-visible:ring-2"
                    />
                  </div>
                  <Button type="submit" size="lg" disabled={!topic.trim()}>
                    Start learning
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {["Cited sources", "Adaptive difficulty", "Progress tracking"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-secondary text-secondary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -top-5 -left-5 size-24 rounded-3xl bg-accent/70 -rotate-6" />
            <div className="absolute -right-7 -bottom-7 size-32 rounded-full bg-secondary/80" />
            <Card className="relative border-2 border-foreground/10 bg-card/95 shadow-[0_24px_70px_-35px_oklch(0.22_0.026_72/0.55)]">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">Today&apos;s path</p>
                    <CardTitle className="mt-1 text-xl">
                      Foundations of quantum computing
                    </CardTitle>
                  </div>
                  <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                    <BrainCircuit className="size-6" />
                  </div>
                </div>
                <CardDescription className="mt-2">
                  Built for a visual learner with 30 minutes to focus.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Course progress</span>
                  <span className="font-bold text-primary">42%</span>
                </div>
                <Progress value={42} className="h-3 bg-muted" />
                <div className="space-y-3">
                  {[
                    {
                      icon: Check,
                      title: "Classical bits vs. qubits",
                      meta: "Complete",
                      tone: "bg-secondary text-secondary-foreground",
                    },
                    {
                      icon: BookOpen,
                      title: "Superposition, visually",
                      meta: "8 min",
                      tone: "bg-accent text-accent-foreground",
                    },
                    {
                      icon: Trophy,
                      title: "Knowledge check",
                      meta: "5 questions",
                      tone: "bg-muted text-muted-foreground",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 rounded-xl border bg-background/70 p-3"
                    >
                      <span
                        className={`grid size-10 place-items-center rounded-xl ${item.tone}`}
                      >
                        <item.icon className="size-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.meta}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
                  <Clock3 className="size-4 text-primary" />
                  Your next milestone is 12 minutes away.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
