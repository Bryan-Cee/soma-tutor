import type { ReactNode } from "react";
import { BookOpenCheck, Sparkles } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="relative grid min-h-screen overflow-hidden lg:grid-cols-[1fr_0.92fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex">
        <div className="absolute -top-28 -right-20 size-80 rounded-full bg-primary/35 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-secondary-foreground/30 blur-3xl" />
        <Brand className="relative z-10 text-background" />
        <div className="relative z-10 max-w-lg">
          <Badge className="mb-6 border-background/15 bg-background/10 text-background shadow-none">
            <Sparkles className="size-3.5" />
            Your learning, personalized
          </Badge>
          <h1 className="text-5xl leading-[1.03] font-bold tracking-[-0.045em]">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-background/70">
            {description}
          </p>
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-background/10 bg-background/5 p-4">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Learn with evidence</p>
              <p className="text-sm text-background/60">
                Every generated lesson includes its sources.
              </p>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-sm text-background/45">
          Powered by GitHub Copilot
        </p>
      </section>

      <section className="flex min-h-screen flex-col bg-background/90 p-5 sm:p-8">
        <Brand className="lg:hidden" />
        <div className="flex flex-1 items-center justify-center py-10">
          {children}
        </div>
      </section>
    </main>
  );
}
