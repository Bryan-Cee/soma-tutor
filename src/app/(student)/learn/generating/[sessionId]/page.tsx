import { notFound, redirect } from "next/navigation";
import {
  GenerationStatus,
  type GenerationSnapshot,
} from "@/components/generation/generation-status";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";

type GenerationPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function GenerationPage({
  params,
}: GenerationPageProps): Promise<React.ReactNode> {
  const user = await getAuthUser();
  if (!user) redirect("/sign-in");

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

  if (!session) notFound();

  const dashboardHref =
    user.role === "TEACHER" ? "/teacher/dashboard" : "/dashboard";

  return (
    <GenerationStatus
      dashboardHref={dashboardHref}
      initialSnapshot={session satisfies GenerationSnapshot}
    />
  );
}
