import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell
      title="Come back to your next breakthrough."
      description="Continue a course, test what you remember, or turn a new question into a guided path."
    >
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            cardBox: "w-full shadow-none",
            card: "w-full rounded-2xl border-2 border-foreground/10 bg-card shadow-[0_20px_55px_-38px_oklch(0.22_0.026_72/0.55)]",
            headerTitle: "text-2xl font-bold tracking-tight text-foreground",
            headerSubtitle: "text-muted-foreground",
            formButtonPrimary:
              "rounded-xl bg-primary text-primary-foreground hover:bg-primary/90",
            formFieldInput:
              "rounded-xl border-input bg-background text-foreground",
            footerActionLink: "font-semibold text-primary hover:text-primary/80",
          },
        }}
      />
    </AuthShell>
  );
}
