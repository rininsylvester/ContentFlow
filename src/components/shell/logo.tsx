import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Zap className="size-4" aria-hidden />
      </span>
      <span className={cn(compact && "sr-only")}>CreatorHub</span>
    </span>
  );
}
