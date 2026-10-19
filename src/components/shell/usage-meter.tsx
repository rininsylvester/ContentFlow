import { Progress } from "@/components/ui/progress";
import type { UsageSummary } from "@/lib/billing/usage-summary";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function UsageMeter({ usage }: { usage: UsageSummary }) {
  const pct = usage.limit === 0 ? 100 : Math.min(100, (usage.used / usage.limit) * 100);
  const low = usage.remaining <= Math.max(1, Math.floor(usage.limit * 0.1));
  const label = usage.kind === "trial" ? "Free generations" : "Generations this month";

  return (
    <div className="space-y-2 rounded-md border border-sidebar-border p-3 group-data-[collapsed=true]/sidebar:hidden">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {usage.used}/{usage.limit}
        </span>
      </div>
      <Progress
        value={pct}
        aria-label={`${label}: ${usage.used} of ${usage.limit} used`}
        indicatorClassName={cn(low && "bg-warning")}
      />
      <p className="text-xs text-muted-foreground">
        {usage.kind === "trial"
          ? `${usage.remaining} left — then $5/month`
          : usage.resetsAt
            ? `Resets ${dateFormat.format(usage.resetsAt)}`
            : `${usage.remaining} left`}
      </p>
    </div>
  );
}
