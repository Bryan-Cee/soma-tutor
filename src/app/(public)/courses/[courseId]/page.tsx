import { notFound } from "next/navigation";
import { CoursePreview } from "@/components/course/course-preview";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";

type PublicCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function PublicCoursePage({
  params,
}: PublicCoursePageProps): Promise<React.ReactNode> {
  const { courseId } = await params;
  const [course, user] = await Promise.all([
    db.course.findFirst({
      where: {
        id: courseId,
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      select: {
        id: true,
        title: true,
        description: true,
        topic: true,
        difficulty: true,
        creatorId: true,
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            _count: {
              select: {
                lessons: true,
                quizzes: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    }),
    getAuthUser(),
  ]);

  if (!course) notFound();

  const enrollment = user
    ? await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
        select: { id: true },
      })
    : null;

  return (
    <CoursePreview
      course={course}
      isSignedIn={user !== null}
      canOpen={user?.id === course.creatorId || enrollment !== null}
      returnPath={`/courses/${course.id}`}
    />
  );
}
