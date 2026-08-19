import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getStudentDashboard } from "@/services/progress.service";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Flame,
  Library,
  Sparkles,
  Trophy,
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
import { Progress } from "@/components/ui/progress";

export default async function StudentDashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/sign-in");

  const courses = await getStudentDashboard(user.id);

  const firstName = user.name?.split(" ")[0];
  const totalCompleted = courses.reduce(
    (sum, course) => sum + course.progress.completedLessons,
    0
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeading
        eyebrow="Your learning space"
        title={firstName ? `Keep going, ${firstName}` : "Keep learning"}
        description={
          courses.length === 0
            ? "Choose something you are curious about and Soma will build the right path."
            : "Pick up where you left off or start a fresh learning path."
        }
        action={
          <Button asChild size="lg">
            <Link href="/learn/onboarding">
              <Sparkles />
              Learn something new
            </Link>
          </Button>
        }
      />

      {courses.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Library,
              value: courses.length,
              label: "Active paths",
              tone: "bg-accent text-accent-foreground",
            },
            {
              icon: Trophy,
              value: totalCompleted,
              label: "Lessons complete",
              tone: "bg-secondary text-secondary-foreground",
            },
            {
              icon: Flame,
              value: courses.filter((course) => course.progress.percentage > 0)
                .length,
              label: "Paths in motion",
              tone: "bg-primary/12 text-primary",
            },
          ].map((stat) => (
            <Card key={stat.label} size="sm">
              <CardContent className="flex items-center gap-4">
                <span
                  className={`grid size-11 place-items-center rounded-xl ${stat.tone}`}
                >
                  <stat.icon className="size-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {courses.length === 0 ? (
        <Card className="mt-10 border-2 border-dashed bg-card/70 py-14 text-center">
          <CardContent className="mx-auto flex max-w-md flex-col items-center">
            <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <BookOpen className="size-7" />
            </span>
            <CardTitle className="text-xl">Start with one good question</CardTitle>
            <CardDescription className="mt-2 text-base leading-7">
              Tell Soma what you want to understand. You will get a learning
              path built for your level, goals, and available time.
            </CardDescription>
            <Button asChild size="lg" className="mt-6">
              <Link href="/learn/onboarding">
                Build my first path
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow">Continue learning</p>
              <h2 className="mt-1 text-xl font-bold">Your active paths</h2>
            </div>
            <Badge variant="outline">{courses.length} total</Badge>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="group transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_-30px_oklch(0.22_0.026_72/0.55)]"
            >
              <CardHeader>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Badge variant="secondary" className="capitalize">
                    {course.difficulty.toLowerCase()}
                  </Badge>
                  <span className="text-sm font-bold text-primary">
                    {course.progress.percentage}%
                  </span>
                </div>
                <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary">
                  {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 leading-6">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <Progress value={course.progress.percentage} className="h-2.5" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Trophy className="size-3.5 text-primary" />
                    {course.progress.completedLessons}/
                    {course.progress.totalLessons} lessons
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-3.5" />
                    Continue
                  </span>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/course/${course.id}`}>
                    Open learning path
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
