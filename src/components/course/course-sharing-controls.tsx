"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Globe2,
  Link2,
  Loader2,
  LockKeyhole,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CourseSharingControlsProps = {
  courseId: string;
  initialVisibility: "PRIVATE" | "PUBLIC";
  initialShareUrl: string | null;
};

export function CourseSharingControls({
  courseId,
  initialVisibility,
  initialShareUrl,
}: CourseSharingControlsProps): React.ReactNode {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [shareUrl, setShareUrl] = useState(initialShareUrl);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getPrivateLink(): Promise<void> {
    setBusyAction("link");
    setError(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/sharing`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Could not create the share link");
      const body: { url: string } = await response.json();
      setShareUrl(body.url);
      await navigator.clipboard.writeText(body.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not share this course"
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function copyPrivateLink(): Promise<void> {
    if (!shareUrl) return;
    const absoluteUrl = new URL(shareUrl, window.location.origin).toString();
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  async function revokePrivateLink(): Promise<void> {
    setBusyAction("revoke");
    setError(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/sharing`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not disable the share link");
      setShareUrl(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not update sharing"
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function togglePublic(): Promise<void> {
    const nextVisibility = visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    setBusyAction("visibility");
    setError(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/sharing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: nextVisibility }),
      });
      if (!response.ok) throw new Error("Could not update course visibility");
      setVisibility(nextVisibility);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not update sharing"
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <Card className="mt-6 bg-secondary/25" size="sm">
      <CardContent className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">Share this course</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Each learner gets independent progress and quiz history.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {shareUrl ? (
              <>
                <Button variant="outline" onClick={copyPrivateLink}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied" : "Copy private link"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={revokePrivateLink}
                  disabled={busyAction !== null}
                >
                  {busyAction === "revoke" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Unlink />
                  )}
                  Disable link
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={getPrivateLink}
                disabled={busyAction !== null}
              >
                {busyAction === "link" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Link2 />
                )}
                Create private link
              </Button>
            )}
            <Button
              variant={visibility === "PUBLIC" ? "secondary" : "outline"}
              onClick={togglePublic}
              disabled={busyAction !== null}
            >
              {busyAction === "visibility" ? (
                <Loader2 className="animate-spin" />
              ) : visibility === "PUBLIC" ? (
                <Globe2 />
              ) : (
                <LockKeyhole />
              )}
              {visibility === "PUBLIC" ? "Public" : "Make public"}
            </Button>
          </div>
        </div>
        {visibility === "PUBLIC" && (
          <p className="text-sm text-secondary-foreground">
            This course appears in the public course library.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
