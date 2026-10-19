import type { NavItem } from "@/lib/tools";

export function ToolHeader({ item }: { item: Pick<NavItem, "label" | "description" | "icon"> }) {
  const Icon = item.icon;
  return (
    <header className="flex items-start gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{item.label}</h1>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
    </header>
  );
}
