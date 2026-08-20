import { notFound } from "next/navigation";
import { CoursePreview } from "@/components/course/course-preview";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";

type SharedCoursePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharedCoursePage({
  params,
}: SharedCoursePageProps): Promise<React.ReactNode> {
  const { token } = await params;
  const [shareLink, user] = await Promise.all([
    db.courseShareLink.findFirst({
      where: {
        token,
        isActive: true,
        course: { status: "PUBLISHED" },
      },
      select: {
        course: {
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
        },
      },
    }),
    getAuthUser(),
  ]);

  if (!shareLink) notFound();

  const enrollment = user
    ? await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: shareLink.course.id,
          },
        },
        select: { id: true },
      })
    : null;

  return (
    <CoursePreview
      course={shareLink.course}
      isSignedIn={user !== null}
      canOpen={
        user?.id === shareLink.course.creatorId || enrollment !== null
      }
      returnPath={`/share/${token}`}
      shareToken={token}
      privateShare
    />
  );
}
