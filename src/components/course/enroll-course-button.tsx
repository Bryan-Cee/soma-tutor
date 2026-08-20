"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type EnrollCourseButtonProps = {
  courseId: string;
  shareToken?: string;
};

export function EnrollCourseButton({
  courseId,
  shareToken,
}: EnrollCourseButtonProps): React.ReactNode {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enroll(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken }),
      });
      if (!response.ok) {
        const body: { error?: string } = await response.json();
        throw new Error(body.error ?? "Enrollment failed");
      }

      router.push(`/course/${courseId}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Enrollment failed");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button size="lg" onClick={enroll} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            Adding course...
          </>
        ) : (
          <>
            Add to my learning
            <ArrowRight data-icon="inline-end" />
          </>
        )}
      </Button>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
