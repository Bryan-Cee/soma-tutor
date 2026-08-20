import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCourseProgress } from "@/services/progress.service";
import { canUseCourse } from "@/services/course-access.service";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  FileQuestion,
  Globe2,
  Users,
} from "lucide-react";
import { CourseSharingControls } from "@/components/course/course-sharing-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseOverviewPage({ params }: Props) {
  const { courseId } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/sign-in");

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      learningSessions: {
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
      shareLink: {
        where: { isActive: true },
        select: { token: true },
      },
      _count: {
        select: { enrollments: true },
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
          quizzes: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course) notFound();
  if (course.status !== "PUBLISHED") {
    const generationSession = course.learningSessions[0];
    if (generationSession) {
      redirect(`/learn/generating/${generationSession.id}`);
    }
    notFound();
  }
  if (!(await canUseCourse(user.id, courseId))) notFound();

  const progress = await getCourseProgress(user.id, courseId);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Button asChild variant="ghost" className="mb-5 -ml-3 shadow-none">
        <Link href="/dashboard">
          <ArrowLeft />
          Back to dashboard
        </Link>
      </Button>

      <Card className="overflow-hidden border-2 border-foreground/10 bg-card/95">
        <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-secondary-foreground/60" />
        <CardHeader className="gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
            {course.difficulty.toLowerCase()}
            </Badge>
            <Badge variant="outline">{course.modules.length} modules</Badge>
            {course.visibility === "PUBLIC" && (
              <Badge variant="outline">
                <Globe2 />
                Public
              </Badge>
            )}
            <Badge variant="outline">
              <Users />
              {course._count.enrollments}{" "}
              {course._count.enrollments === 1 ? "learner" : "learners"}
            </Badge>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            {course.title}
            </CardTitle>
            <CardDescription className="mt-3 max-w-3xl text-base leading-7">
            {course.description}
            </CardDescription>
          </div>
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold">
              {progress.completedLessons}/{progress.totalLessons} lessons
              complete
            </span>
            <span className="font-bold text-primary">
              {progress.percentage}%
            </span>
            </div>
            <Progress value={progress.percentage} className="h-3" />
          </div>
        </CardHeader>
      </Card>

      {course.creatorId === user.id && (
        <CourseSharingControls
          courseId={course.id}
          initialVisibility={course.visibility}
          initialShareUrl={
            course.shareLink ? `/share/${course.shareLink.token}` : null
          }
        />
      )}

      {course.sourceLinks.length > 0 && (
        <Card className="mt-6" size="sm">
          <CardContent>
            <div className="mb-3 flex items-center gap-2">
            <ExternalLink className="size-4 text-primary" />
            <h2 className="font-semibold">Course sources</h2>
            </div>
            <div className="flex flex-wrap gap-2">
            {course.sourceLinks.map((link) => (
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

      <div className="mt-10">
        <p className="eyebrow">Course map</p>
        <h2 className="mt-1 mb-5 text-2xl font-bold">Your modules</h2>
        <div className="space-y-5">
        {course.modules.map((mod) => (
          <Card key={mod.id}>
            <CardHeader className="border-b bg-muted/35">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent font-bold text-accent-foreground">
                {mod.order + 1}
              </span>
              <div>
                <CardTitle className="text-lg">{mod.title}</CardTitle>
                <CardDescription className="mt-1 leading-6">
                  {mod.description}
                </CardDescription>
              </div>
            </div>
            </CardHeader>
            <CardContent className="divide-y p-0">
            {mod.lessons.map((lesson) => {
              const completed = progress.completedLessonIds.has(lesson.id);
              return (
                <Button
                  key={lesson.id}
                  asChild
                  variant="ghost"
                  className="h-auto w-full justify-start rounded-none px-5 py-4 text-left shadow-none"
                >
                  <Link href={`/course/${courseId}/lesson/${lesson.id}`}>
                    {completed ? (
                      <CheckCircle className="size-5 text-secondary-foreground" />
                    ) : (
                      <BookOpen className="size-5 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {lesson.title}
                    </span>
                    {completed && (
                      <Badge variant="secondary" className="hidden sm:flex">
                        Complete
                      </Badge>
                    )}
                    <ChevronRight className="text-muted-foreground" />
                  </Link>
                </Button>
              );
            })}
            {mod.quizzes.map((quiz) => (
              <Button
                key={quiz.id}
                asChild
                variant="secondary"
                className="h-auto w-full justify-start rounded-none px-5 py-4 text-left shadow-none"
              >
                <Link href={`/quiz/${quiz.id}`}>
                  <FileQuestion className="size-5" />
                  <span className="min-w-0 flex-1 truncate">
                    Knowledge check: {quiz.title}
                  </span>
                  <ChevronRight />
                </Link>
              </Button>
            ))}
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    </div>
  );
}
