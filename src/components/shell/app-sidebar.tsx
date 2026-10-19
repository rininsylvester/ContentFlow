"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";

const STORAGE_KEY = "creatorhub:sidebar-collapsed";

/** Desktop sidebar. `footer` is a server-rendered slot (usage meter + account). */
export function AppSidebar({ footer }: { footer: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a client-only preference after hydration
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // Storage can be unavailable (private mode); default to expanded.
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore — the preference just won't persist.
      }
      return next;
    });
  }

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "group/sidebar sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 px-4",
          collapsed && "flex-col justify-center px-2",
        )}
      >
        <Link
          href="/ideas"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo compact={collapsed} />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks collapsed={collapsed} />
      </div>
      <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
        {footer}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={cn("justify-start text-muted-foreground", collapsed && "justify-center")}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className={cn(collapsed && "sr-only")}>Collapse</span>
        </Button>
      </div>
    </aside>
  );
}
