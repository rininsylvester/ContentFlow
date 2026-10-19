"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TOOL_NAV, WORKSPACE_NAV, type NavItem } from "@/lib/tools";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function NavLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p
          className={cn(
            "px-2.5 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase",
            collapsed && "sr-only",
          )}
        >
          Tools
        </p>
        {TOOL_NAV.map((item) => (
          <NavLink key={item.id} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <p
          className={cn(
            "px-2.5 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase",
            collapsed && "sr-only",
          )}
        >
          Workspace
        </p>
        {WORKSPACE_NAV.map((item) => (
          <NavLink key={item.id} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}
