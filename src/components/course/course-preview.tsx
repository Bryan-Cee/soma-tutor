import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe2,
  Users,
} from "lucide-react";
import { EnrollCourseButton } from "@/components/course/enroll-course-button";
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

type CoursePreviewProps = {
  course: {
    id: string;
    title: string;
    description: string;
    topic: string;
    difficulty: string;
    modules: Array<{
      id: string;
      title: string;
      description: string;
      order: number;
      _count: {
        lessons: number;
        quizzes: number;
      };
    }>;
    _count: {
      enrollments: number;
    };
  };
  isSignedIn: boolean;
  canOpen: boolean;
  returnPath: string;
  shareToken?: string;
  privateShare?: boolean;
};

export function CoursePreview({
  course,
  isSignedIn,
  canOpen,
  returnPath,
  shareToken,
  privateShare = false,
}: CoursePreviewProps): React.ReactNode {
  const redirectUrl = encodeURIComponent(returnPath);

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <Button asChild variant="ghost" className="shadow-none">
            <Link href="/courses">Browse public courses</Link>
          </Button>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Card className="overflow-hidden border-2 border-foreground/10 bg-card/95">
          <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-secondary-foreground/60" />
          <CardHeader className="gap-5 p-6 sm:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={privateShare ? "outline" : "secondary"}>
                {privateShare ? "Shared with you" : "Public course"}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {course.difficulty.toLowerCase()}
              </Badge>
              <Badge variant="outline">{course.topic}</Badge>
            </div>
            <div>
              <CardTitle className="text-3xl tracking-[-0.035em] sm:text-5xl">
                {course.title}
              </CardTitle>
              <CardDescription className="mt-4 max-w-3xl text-base leading-7">
                {course.description}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                {course.modules.length} modules
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="size-4 text-secondary-foreground" />
                {course._count.enrollments}{" "}
                {course._count.enrollments === 1 ? "person" : "people"} taking
                this course
              </span>
              {!privateShare && (
                <span className="inline-flex items-center gap-2">
                  <Globe2 className="size-4 text-primary" />
                  Open to everyone
                </span>
              )}
            </div>
            <div className="pt-2">
              {canOpen ? (
                <Button asChild size="lg">
                  <Link href={`/course/${course.id}`}>
                    Open my course
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              ) : isSignedIn ? (
                <EnrollCourseButton
                  courseId={course.id}
                  shareToken={shareToken}
                />
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href={`/sign-up?redirect_url=${redirectUrl}`}>
                      Create account to learn
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href={`/sign-in?redirect_url=${redirectUrl}`}>
                      Sign in
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="mt-10">
          <p className="eyebrow">What you will learn</p>
          <h2 className="mt-1 mb-5 text-2xl font-bold">Course modules</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {course.modules.map((module) => (
              <Card key={module.id} size="sm">
                <CardContent className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent font-bold text-accent-foreground">
                    {module.order + 1}
                  </span>
                  <div>
                    <h3 className="font-bold">{module.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {module.description}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-foreground">
                      <CheckCircle2 className="size-3.5" />
                      {module._count.lessons} lessons · {module._count.quizzes}{" "}
                      knowledge checks
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
