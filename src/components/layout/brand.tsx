import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
};

export function Brand({ className }: BrandProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight",
        className
      )}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_3px_0_var(--primary-shadow)]">
        <Sparkles className="size-4.5" strokeWidth={2.5} />
      </span>
      <span>
        Soma<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
