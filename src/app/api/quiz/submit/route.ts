import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { submitQuiz } from "@/services/quiz.service";
import { canUseCourse } from "@/services/course-access.service";

export async function POST(req: Request): Promise<NextResponse> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { quizId, answers } = await req.json();
  if (!quizId || !answers) {
    return NextResponse.json(
      { error: "quizId and answers required" },
      { status: 400 }
    );
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: {
      module: {
        select: { courseId: true },
      },
    },
  });
  if (
    !quiz ||
    !(await canUseCourse(user.id, quiz.module.courseId))
  ) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const result = await submitQuiz(user.id, { quizId, answers });
  return NextResponse.json(result);
}
