import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";
import { PublicCourseCard } from "@/components/course/public-course-card";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublicCoursesPage(): Promise<React.ReactNode> {
  const courses = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
    },
    orderBy: [
      { enrollments: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      description: true,
      difficulty: true,
      topic: true,
      _count: {
        select: {
          enrollments: true,
          modules: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <Button asChild>
            <Link href="/dashboard">
              My dashboard
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Badge variant="secondary" className="mb-5">
          <Globe2 />
          Community learning
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          Learn from courses the community already built
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          Add a course to your dashboard and learn with your own progress,
          completions, and quiz history.
        </p>

        {courses.length === 0 ? (
          <div className="mt-12 rounded-2xl border-2 border-dashed p-10 text-center text-muted-foreground">
            No public courses yet.
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <PublicCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
