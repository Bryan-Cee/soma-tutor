import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { learningPreferencesSchema, mapGoalToMode } from "@/types/generation";

export async function POST(req: Request): Promise<NextResponse> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = learningPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preferences", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const prefs = parsed.data;
  const mode = mapGoalToMode(prefs.goal);

  const { course, session } = await db.$transaction(async (transaction) => {
    const pendingCourse = await transaction.course.create({
      data: {
        title: prefs.topic,
        description: "Soma is building this learning path now.",
        topic: prefs.topic,
        difficulty:
          prefs.knowledgeLevel === "beginner"
            ? "BEGINNER"
            : prefs.knowledgeLevel === "intermediate"
              ? "INTERMEDIATE"
              : "ADVANCED",
        status: "GENERATING",
        sourceLinks: [],
        creatorId: user.id,
      },
    });

    const pendingSession = await transaction.learningSession.create({
      data: {
        topic: prefs.topic,
        preferences: prefs,
        generationMode: mode,
        status: "GENERATING",
        generationProgress: 0,
        generationMessage: "Waiting for the generation worker",
        userId: user.id,
        courseId: pendingCourse.id,
      },
    });

    await transaction.enrollment.create({
      data: {
        userId: user.id,
        courseId: pendingCourse.id,
      },
    });
    await transaction.studentProgress.create({
      data: {
        userId: user.id,
        courseId: pendingCourse.id,
      },
    });
    await transaction.generationJob.create({
      data: {
        sessionId: pendingSession.id,
      },
    });

    return { course: pendingCourse, session: pendingSession };
  });

  return NextResponse.json(
    { courseId: course.id, sessionId: session.id },
    { status: 202 }
  );
}
