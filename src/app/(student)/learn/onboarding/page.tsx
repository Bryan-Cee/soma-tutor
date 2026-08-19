import { Suspense } from "react";
import OnboardingForm from "./onboarding-form";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <OnboardingForm />
    </Suspense>
  );
}
