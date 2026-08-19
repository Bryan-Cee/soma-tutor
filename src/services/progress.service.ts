import { db } from "@/lib/db";

export async function markLessonComplete(
  userId: string,
  courseId: string,
  lessonId: string
): Promise<void> {
  const progress = await db.studentProgress.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { currentLessonId: lessonId },
    create: { userId, courseId, currentLessonId: lessonId },
  });

  await db.lessonCompletion.upsert({
    where: { progressId_lessonId: { progressId: progress.id, lessonId } },
    update: {},
    create: { progressId: progress.id, lessonId },
  });
}

export async function getCourseProgress(userId: string, courseId: string) {
  const course = await db.course.findUniqueOrThrow({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" }, select: { id: true } },
        },
      },
    },
  });

  const progress = await db.studentProgress.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: {
      lessonCompletions: { select: { lessonId: true } },
    },
  });

  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );
  const completedLessons = progress?.lessonCompletions.length ?? 0;

  const completedLessonIds = new Set(
    progress?.lessonCompletions.map((lc) => lc.lessonId) ?? []
  );

  return {
    totalLessons,
    completedLessons,
    percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    completedLessonIds,
    currentLessonId: progress?.currentLessonId ?? null,
    currentModuleId: progress?.currentModuleId ?? null,
  };
}

export async function getStudentDashboard(userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const coursesWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progress = await getCourseProgress(userId, enrollment.courseId);
      return {
        ...enrollment.course,
        progress,
      };
    })
  );

  return coursesWithProgress;
}
