"use client";

import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";

export function MobileNav({ footer }: { footer: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-sidebar p-0">
        <div className="flex h-14 items-center px-4">
          <SheetTitle>
            <Logo />
          </SheetTitle>
          <SheetDescription className="sr-only">Navigate between tools</SheetDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-sidebar-border p-3">{footer}</div>
      </SheetContent>
    </Sheet>
  );
}
