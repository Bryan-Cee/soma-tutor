import Link from "next/link";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PublicCourseCardProps = {
  course: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    topic: string;
    _count: {
      enrollments: number;
      modules: number;
    };
  };
};

export function PublicCourseCard({
  course,
}: PublicCourseCardProps): React.ReactNode {
  return (
    <Card className="group transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_-30px_oklch(0.22_0.026_72/0.55)]">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between gap-3">
          <Badge variant="secondary" className="capitalize">
            {course.difficulty.toLowerCase()}
          </Badge>
          <Badge variant="outline">{course.topic}</Badge>
        </div>
        <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 leading-6">
          {course.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="flex items-center gap-5 rounded-xl bg-muted/60 p-3 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-4 text-primary" />
            {course._count.modules} modules
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4 text-secondary-foreground" />
            {course._count.enrollments}{" "}
            {course._count.enrollments === 1 ? "learner" : "learners"}
          </span>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/courses/${course.id}`}>
            View course
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
