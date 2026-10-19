import type { CalendarStatus } from "@/lib/db/schema/enums";

export const STATUS_META: Record<
  CalendarStatus,
  { label: string; className: string; dot: string }
> = {
  idea: { label: "Idea", className: "border-sky-500/40 bg-sky-500/10", dot: "bg-sky-500" },
  scripted: { label: "Scripted", className: "border-primary/40 bg-primary/10", dot: "bg-primary" },
  filmed: { label: "Filmed", className: "border-warning/40 bg-warning/10", dot: "bg-warning" },
  posted: { label: "Posted", className: "border-success/40 bg-success/10", dot: "bg-success" },
};
