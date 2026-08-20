import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import {
  canEnrollInCourse,
  enrollInCourse,
} from "@/services/course-access.service";

const enrollmentSchema = z.object({
  shareToken: z.string().min(1).optional(),
});

type CourseRouteContext = {
  params: Promise<{ courseId: string }>;
};

export async function POST(
  request: Request,
  context: CourseRouteContext
): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = enrollmentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid enrollment" }, { status: 400 });
  }

  const { courseId } = await context.params;
  const allowed = await canEnrollInCourse(courseId, parsed.data.shareToken);
  if (!allowed) {
    return NextResponse.json(
      { error: "This course is not available for enrollment" },
      { status: 403 }
    );
  }

  await enrollInCourse(user.id, courseId);
  return NextResponse.json({ courseId });
}
