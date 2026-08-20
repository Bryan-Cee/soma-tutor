import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getQuizWithQuestions } from "@/services/quiz.service";
import { canUseCourse } from "@/services/course-access.service";
import Link from "next/link";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const quiz = await getQuizWithQuestions(quizId).catch(() => null);
  if (!quiz) notFound();

  const courseModule = await db.module.findUnique({
    where: { id: quiz.moduleId },
    include: { course: { select: { id: true, title: true } } },
  });
  if (
    !courseModule ||
    !(await canUseCourse(user.id, courseModule.course.id))
  ) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Button asChild variant="ghost" className="mb-5 -ml-3 shadow-none">
        <Link href={`/course/${courseModule.course.id}`}>
          <ArrowLeft />
          Back to {courseModule.course.title}
        </Link>
      </Button>

      <Badge variant="secondary" className="mb-3 gap-1.5">
        <CircleHelp className="size-3.5" />
        Knowledge check
      </Badge>
      <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
        {quiz.title}
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        {quiz.questions.length} questions · Take your time and think it through
      </p>

      <QuizPlayer quizId={quiz.id} questions={quiz.questions} />
    </div>
  );
}
