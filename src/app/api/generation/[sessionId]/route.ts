import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const session = await db.learningSession.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
    },
    select: {
      id: true,
      topic: true,
      status: true,
      generationProgress: true,
      generationMessage: true,
      errorMessage: true,
      course: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Generation session not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(session, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
