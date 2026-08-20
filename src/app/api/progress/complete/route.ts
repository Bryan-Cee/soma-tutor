import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { markLessonComplete } from "@/services/progress.service";
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

  const { courseId, lessonId } = await req.json();
  if (!courseId || !lessonId) {
    return NextResponse.json(
      { error: "courseId and lessonId required" },
      { status: 400 }
    );
  }

  const lesson = await db.lesson.findFirst({
    where: {
      id: lessonId,
      module: { courseId },
    },
    select: { id: true },
  });
  if (!lesson || !(await canUseCourse(user.id, courseId))) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  await markLessonComplete(user.id, courseId, lessonId);
  return NextResponse.json({ success: true });
}
