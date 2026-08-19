"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  courseId: string;
  lessonId: string;
};

export function MarkCompleteButton({ courseId, lessonId }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, lessonId }),
      });

      if (!res.ok) throw new Error("Failed to mark complete");

      setDone(true);
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Button variant="secondary" disabled>
        <CheckCircle />
        Completed
      </Button>
    );
  }

  return (
    <Button
      onClick={handleComplete}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <CheckCircle />
      )}
      Mark as complete
    </Button>
  );
}
