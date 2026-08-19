import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { learningPreferencesSchema, mapGoalToMode } from "@/types/generation";
import {
  createFullCourse,
  createStandaloneLesson,
  createStandaloneQuiz,
} from "@/services/course.service";

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

  // Create learning session
  const session = await db.learningSession.create({
    data: {
      topic: prefs.topic,
      preferences: prefs,
      generationMode: mode,
      userId: user.id,
    },
  });

  try {
    let courseId: string;

    switch (mode) {
      case "FULL_COURSE":
        courseId = await createFullCourse(user.id, session.id, prefs);
        break;
      case "LESSON":
        courseId = await createStandaloneLesson(user.id, session.id, prefs);
        break;
      case "QUIZ":
        courseId = await createStandaloneQuiz(user.id, session.id, prefs);
        break;
    }

    return NextResponse.json({ courseId, sessionId: session.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
