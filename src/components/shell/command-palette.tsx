"use client";

import { CreditCard, Moon, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { TOOL_NAV, WORKSPACE_NAV } from "@/lib/tools";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full max-w-64 justify-start text-muted-foreground sm:w-64"
        aria-label="Open command palette"
      >
        <Search />
        <span className="hidden sm:inline">Jump to a tool…</span>
        <kbd className="pointer-events-none ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search tools and actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Tools">
            {TOOL_NAV.map((t) => (
              <CommandItem
                key={t.id}
                value={`${t.label} ${t.description}`}
                onSelect={() => run(() => router.push(t.href))}
              >
                <t.icon />
                {t.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Workspace">
            {WORKSPACE_NAV.map((t) => (
              <CommandItem
                key={t.id}
                value={t.label}
                onSelect={() => run(() => router.push(t.href))}
              >
                <t.icon />
                {t.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem
              value="Brand voice profile"
              onSelect={() => run(() => router.push("/settings/brand-voice"))}
            >
              <UserRound />
              Brand voice
            </CommandItem>
            <CommandItem
              value="Billing subscription"
              onSelect={() => run(() => router.push("/settings/billing"))}
            >
              <CreditCard />
              Billing
            </CommandItem>
            <CommandItem
              value="Toggle theme dark light"
              onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
            >
              <Moon />
              Toggle theme
              <CommandShortcut>{resolvedTheme === "dark" ? "Light" : "Dark"}</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
