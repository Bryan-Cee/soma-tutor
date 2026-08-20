import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleAlert,
  FileStack,
  LoaderCircle,
  PlusCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TeacherDashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user || user.role !== "TEACHER") redirect("/dashboard");

  const courses = await db.course.findMany({
    where: { creatorId: user.id },
    include: {
      modules: { select: { id: true } },
      _count: { select: { enrollments: true } },
      learningSessions: {
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeading
        eyebrow="Teacher workspace"
        title="Build learning that sticks"
        description={`${courses.length} course${courses.length === 1 ? "" : "s"} created · Design, assign, and track from one place.`}
        action={
          <Button asChild size="lg">
            <Link href="/teacher/create">
              <PlusCircle />
              Create course
            </Link>
          </Button>
        }
      />

      {courses.length === 0 ? (
        <Card className="mt-10 border-2 border-dashed bg-card/70 py-14 text-center">
          <CardContent className="mx-auto flex max-w-md flex-col items-center">
            <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Sparkles className="size-7" />
            </span>
            <CardTitle className="text-xl">Create your first course</CardTitle>
            <CardDescription className="mt-2 text-base leading-7">
              Set the topic, audience, and teaching style. Soma will build the
              modules, lessons, and knowledge checks.
            </CardDescription>
            <Button asChild size="lg" className="mt-6">
              <Link href="/teacher/create">
                Start creating
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="eyebrow">Course library</p>
              <h2 className="mt-1 text-2xl font-bold">Your courses</h2>
            </div>
            <Badge variant="outline">{courses.length} total</Badge>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const generation = course.learningSessions[0];
            const isGenerating = course.status === "GENERATING";
            const isFailed = course.status === "FAILED";
            const href =
              isGenerating || isFailed
                ? generation
                  ? `/learn/generating/${generation.id}`
                  : "/teacher/create"
                : `/course/${course.id}`;

            return (
              <Card key={course.id}>
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Badge
                      variant={
                        course.status === "PUBLISHED"
                          ? "secondary"
                          : isFailed
                            ? "destructive"
                            : "outline"
                      }
                      className="capitalize"
                    >
                      {isGenerating
                        ? "building now"
                        : course.status.toLowerCase()}
                    </Badge>
                    {isGenerating ? (
                      <LoaderCircle className="size-5 animate-spin text-primary" />
                    ) : isFailed ? (
                      <CircleAlert className="size-5 text-destructive" />
                    ) : (
                      <FileStack className="size-5 text-primary" />
                    )}
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 leading-6">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex items-center gap-5 rounded-xl bg-muted/60 p-3 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="size-4 text-primary" />
                      {course.modules.length} modules
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4 text-secondary-foreground" />
                      {course._count.enrollments}{" "}
                      {course._count.enrollments === 1
                        ? "learner"
                        : "learners"}
                    </span>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={href}>
                      {isGenerating
                        ? "View generation"
                        : isFailed
                          ? "View details"
                          : "Open course"}
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
