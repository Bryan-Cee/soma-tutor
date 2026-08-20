import { db } from "@/lib/db";

export async function canUseCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const course = await db.course.findFirst({
    where: {
      id: courseId,
      status: "PUBLISHED",
      OR: [
        { creatorId: userId },
        { enrollments: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  return course !== null;
}

export async function enrollInCourse(
  userId: string,
  courseId: string
): Promise<void> {
  await db.$transaction([
    db.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {},
      create: {
        userId,
        courseId,
      },
    }),
    db.studentProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {},
      create: {
        userId,
        courseId,
      },
    }),
  ]);
}

export async function canEnrollInCourse(
  courseId: string,
  shareToken?: string
): Promise<boolean> {
  const course = await db.course.findFirst({
    where: {
      id: courseId,
      status: "PUBLISHED",
      OR: [
        { visibility: "PUBLIC" },
        ...(shareToken
          ? [
              {
                shareLink: {
                  is: {
                    token: shareToken,
                    isActive: true,
                  },
                },
              },
            ]
          : []),
      ],
    },
    select: { id: true },
  });

  return course !== null;
}
