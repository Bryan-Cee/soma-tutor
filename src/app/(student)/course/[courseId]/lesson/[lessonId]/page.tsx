import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { LessonContent } from "@/components/course/lesson-content";
import { MarkCompleteButton } from "@/components/course/mark-complete-button";
import { getAuthUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { courseId, lessonId } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/sign-in");

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: { select: { id: true, title: true } },
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, order: true },
          },
        },
      },
    },
  });

  if (!lesson || lesson.module.course.id !== courseId) notFound();

  // Find prev/next lesson
  const lessons = lesson.module.lessons;
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Button asChild variant="ghost" className="mb-5 -ml-3 shadow-none">
        <Link href={`/course/${courseId}`}>
          <ArrowLeft />
          Back to {lesson.module.course.title}
        </Link>
      </Button>

      <Badge variant="secondary">
        Module {lesson.module.order + 1} · {lesson.module.title}
      </Badge>
      <h1 className="mt-4 mb-7 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
        {lesson.title}
      </h1>

      {lesson.sourceLinks.length > 0 && (
        <Card className="mb-6 bg-secondary/45" size="sm">
          <CardContent>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ExternalLink className="size-4 text-secondary-foreground" />
            Sources for this lesson
            </h2>
            <div className="flex flex-wrap gap-2">
              {lesson.sourceLinks.map((link) => (
                <Badge key={link} asChild variant="outline">
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    {new URL(link).hostname}
                    <ExternalLink data-icon="inline-end" />
                  </a>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-foreground/10">
        <CardContent className="p-6 sm:p-10">
          <LessonContent content={lesson.content} />
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div>
          {prevLesson && (
            <Button asChild variant="outline">
              <Link href={`/course/${courseId}/lesson/${prevLesson.id}`}>
                <ArrowLeft />
                <span className="max-w-40 truncate">{prevLesson.title}</span>
              </Link>
            </Button>
          )}
        </div>

        <MarkCompleteButton
          courseId={courseId}
          lessonId={lessonId}
        />

        <div className="sm:justify-self-end">
          {nextLesson && (
            <Button asChild variant="outline">
              <Link href={`/course/${courseId}/lesson/${nextLesson.id}`}>
                <span className="max-w-40 truncate">{nextLesson.title}</span>
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
