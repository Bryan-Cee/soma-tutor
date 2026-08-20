import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";

const visibilitySchema = z.object({
  visibility: z.enum(["PRIVATE", "PUBLIC"]),
});

type CourseRouteContext = {
  params: Promise<{ courseId: string }>;
};

async function getOwnedPublishedCourse(courseId: string, userId: string) {
  return db.course.findFirst({
    where: {
      id: courseId,
      creatorId: userId,
      status: "PUBLISHED",
    },
    select: { id: true },
  });
}

export async function POST(
  request: Request,
  context: CourseRouteContext
): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await context.params;
  const course = await getOwnedPublishedCourse(courseId, user.id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const shareLink = await db.courseShareLink.upsert({
    where: { courseId },
    update: { isActive: true },
    create: {
      courseId,
      token: randomBytes(24).toString("base64url"),
    },
  });

  return NextResponse.json({
    url: new URL(`/share/${shareLink.token}`, request.url).toString(),
  });
}

export async function PATCH(
  request: Request,
  context: CourseRouteContext
): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await context.params;
  const course = await getOwnedPublishedCourse(courseId, user.id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const parsed = visibilitySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
  }

  const updatedCourse = await db.course.update({
    where: { id: courseId },
    data: { visibility: parsed.data.visibility },
    select: { visibility: true },
  });

  return NextResponse.json(updatedCourse);
}

export async function DELETE(
  _request: Request,
  context: CourseRouteContext
): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await context.params;
  const course = await getOwnedPublishedCourse(courseId, user.id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  await db.courseShareLink.updateMany({
    where: { courseId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
